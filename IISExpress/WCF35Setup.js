// Configures Windows Communication Foundation 3.5 for WebMatrix
// 
// Usage: 
//    WCF35Setup.js [un]install

function WCFHandler(name, path, mode, bitness)
{
    this._name = name;
    this._path = path;
    this._mode = mode;
    this._bitness = bitness;
}

var moduleName = "ServiceModel";

var wcfHandlers = new Array( new WCFHandler("svc-Integrated", "*.svc", "integrated", null),
                             new WCFHandler("rules-Integrated", "*.rules", "integrated", null),
                             new WCFHandler("xoml-Integrated", "*.xoml", "integrated", null),

                             new WCFHandler("svc-ISAPI-2.0", "*.svc", "classic", "x86"),
                             new WCFHandler("rules-ISAPI-2.0", "*.rules", "classic", "x86"),
                             new WCFHandler("xoml-ISAPI-2.0", "*.xoml", "classic", "x86"),

                             new WCFHandler("svc-ISAPI-2.0-64", "*.svc", "classic", "x64"),
                             new WCFHandler("rules-64-ISAPI-2.0", "*.rules", "classic", "x64"),
                             new WCFHandler("xoml-64-ISAPI-2.0", "*.xoml", "classic", "x64"));

//
// main start
//
try { 
    var mode = ParseArguments();
    if (mode == "install")
    {
        UninstallWCF();
        InstallWCF(); 
        WScript.Echo("WCF 3.5 has been configured for IIS Express.");
    }
    else if (mode == "uninstall")
    {
        UninstallWCF();
        WScript.Echo("WCF 3.5 has been uninstalled from IIS Express.");
    }
    else
    {
        PrintUsage();
    }
} 
catch(e) { 
    WScript.Echo("An error occurred:\r\n " + e.description); 
} 
//
// main end
//

function InstallWCF() { 
    var adminManager = GetAdminManager(); 
 
    AddModule(adminManager);
    AddHandlers(adminManager);
 
    adminManager.CommitChanges(); 
} 

function UninstallWCF() {
    var adminManager = GetAdminManager(); 
    var moduleSection = adminManager.GetAdminSection("system.webServer/modules", "MACHINE/WEBROOT/APPHOST");

    var modulePosition = FindElement(moduleSection.Collection, "add", ["name", moduleName]); 
    if (modulePosition != -1) 
    {
      moduleSection.Collection.DeleteElement(modulePosition); 
    }

    var handlerSection = adminManager.GetAdminSection("system.webServer/handlers", "MACHINE/WEBROOT/APPHOST");

    for (i = 0; i < wcfHandlers.length; i++)
    {
        var svcPosition = FindElement(handlerSection.Collection, "add", ["name", wcfHandlers[i]._name]); 
        if (svcPosition != -1) 
        {
          handlerSection.Collection.DeleteElement(svcPosition); 
        }
    }
    
    adminManager.CommitChanges(); 
}

function AddModule(adminManager)
{
    var moduleSection = adminManager.GetAdminSection("system.webServer/modules", "MACHINE/WEBROOT/APPHOST");
    var element = moduleSection.Collection.CreateNewElement("add"); 

    element.Properties.Item("name").Value = moduleName; 
    element.Properties.Item("type").Value = "System.ServiceModel.Activation.HttpModule, System.ServiceModel, Version=3.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089";
    element.Properties.Item("preCondition").Value = "managedHandler,runtimeVersionv2.0";

    moduleSection.Collection.AddElement(element, -1); 
}

function AddHandlers(adminManager)
{
    var handlerSection = adminManager.GetAdminSection("system.webServer/handlers", "MACHINE/WEBROOT/APPHOST");

    for (var i = 0; i < wcfHandlers.length; i++) 
    {
        if (wcfHandlers[i]._mode == "integrated") 
        {
            AddIntegratedHandler(handlerSection, wcfHandlers[i]._name, wcfHandlers[i]._path);
        }
        else if (wcfHandlers[i]._mode == "classic") 
        {
            AddISAPIHandler(handlerSection, wcfHandlers[i]._name, wcfHandlers[i]._path, wcfHandlers[i]._bitness );
        }
        else 
        {
            throw new Error("Unrecognized mode [" + wcfHandlers[i]._mode + "]");
        }
    }
}

function AddIntegratedHandler(section, name, path)
{
    var element = section.Collection.CreateNewElement("add"); 
    element.Properties.Item("name").Value = name; 
    element.Properties.Item("path").Value = path; 
    element.Properties.Item("verb").Value = "*"; 
    element.Properties.Item("type").Value = "System.ServiceModel.Activation.HttpHandler, System.ServiceModel, Version=3.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089";
    element.Properties.Item("preCondition").Value = "integratedMode,runtimeVersionv2.0"; 
    section.Collection.AddElement(element, 0); 
}

function AddISAPIHandler(section, name, path, bitness)
{
    var element = section.Collection.CreateNewElement("add");
    var scriptProcessor = null;
    var preCondition = null;

    if (bitness == "x86") 
    {
        scriptProcessor = "%SystemRoot%\\Microsoft.NET\\Framework\\v2.0.50727\\aspnet_isapi.dll";
        preCondition = "classicMode,runtimeVersionv2.0,bitness32"; 
    }
    else if (bitness == "x64") 
    {
        scriptProcessor = "%SystemRoot%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll";
        preCondition = "classicMode,runtimeVersionv2.0,bitness64"; 
    }
    else 
    {
        throw new Error("Unrecognized bitness [" + bitness + "]");
    }

    element.Properties.Item("name").Value = name; 
    element.Properties.Item("path").Value = path; 
    element.Properties.Item("verb").Value = "*"; 
    element.Properties.Item("modules").Value = "IsapiModule";
    element.Properties.Item("scriptProcessor").Value = scriptProcessor;
    element.Properties.Item("preCondition").Value = preCondition;

    section.Collection.AddElement(element, 0); 
}

function GetAdminManager()
{
    try
    {
        var vermg = new ActiveXObject("Microsoft.IIS.VersionManager");
        var exp = vermg.GetVersionObject("10.0", 1);
        return adminManager = exp.CreateObjectFromProgId("Microsoft.ApplicationHost.WritableAdminManager");
    }
    catch(e)
    {
        throw new Error("Unable to create WritableAdminManager.\r\n Please ensure that IIS Express is installed properly.\r\n\r\n  " + e.description);
    }
}

function FindElement(collection, elementTagName, valuesToMatch) 
{ 
    for (var i = 0; i < collection.Count; i++) 
    { 
        var element = collection.Item(i); 
         
        if (element.Name == elementTagName) 
        { 
            var matches = true; 
            for (var iVal = 0; iVal < valuesToMatch.length; iVal += 2) 
            { 
                var property = element.GetPropertyByName(valuesToMatch[iVal]); 
                var value = property.Value; 
                if (value != null) 
                { 
                    value = value.toString(); 
                } 
                if (value != valuesToMatch[iVal + 1]) 
                { 
                    matches = false; 
                    break; 
                } 
            } 
            if (matches) 
            { 
                return i; 
            } 
        } 
    } 
     
    return -1; 
}

function ParseArguments()
{
    var mode = "";
    
    if (WScript.Arguments.Count() > 0)
    {
        if (WScript.Arguments.Item(0).toLowerCase() == "install")
        {
            mode="install";
        }
        else if (WScript.Arguments.Item(0).toLowerCase() == "uninstall")
        {
            mode="uninstall";
        }
    }
    
    return mode;
}

function PrintUsage()
{
    WScript.Echo("Usage:\r\n   WCF35Setup.js <cmd>\r\n\r\nDescription:\r\nAdministration utility that enables configuation of WCF 3.5 for IIS Express\r\n\r\nSupported Commands:\r\n install, uninstall\r\n\r\nSamples:\r\n WCF35Setup.js install\r\n WCF35Setup.js uninstall");
}

// SIG // Begin signature block
// SIG // MIIapQYJKoZIhvcNAQcCoIIaljCCGpICAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFIi1ZLl7QdBL
// SIG // By8iPp3D6iTn0GZwoIIViDCCBNowggPCoAMCAQICEzMA
// SIG // AAEhTrIDTT8kaTYAAAAAASEwDQYJKoZIhvcNAQEFBQAw
// SIG // dzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBMB4XDTE4MTAyNDIx
// SIG // MDczOVoXDTIwMDExMDIxMDczOVowgcoxCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xJTAjBgNVBAsTHE1pY3Jvc29mdCBBbWVy
// SIG // aWNhIE9wZXJhdGlvbnMxJjAkBgNVBAsTHVRoYWxlcyBU
// SIG // U1MgRVNOOjhBODItRTM0Ri05RERBMSUwIwYDVQQDExxN
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIIBIjAN
// SIG // BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8OAL4/+m
// SIG // +qXuRcEvrHz2MGcuQv4zw6QkHzgDDoo5hqbuk+xFaVf2
// SIG // xo15JQRRJ/sSwIXeDqDS6Yf42Vwnsc3KHLtdqKeaJUZJ
// SIG // CMs72WeHlyb21Qg+eCYdBOa/ht/S5n++6gjS/4OAZrVB
// SIG // eic7rea/dV65LzTFfFGGA5MgE+aAL3j67msBrqx47Fvx
// SIG // Q9lXMp14BFgOpr0fBG7W2e8pccqFMiEop2Efw5wBmSBp
// SIG // j/TEqjDohqRi8EXFur88rE+qJ5096IHTheYC0/moSfoO
// SIG // tKetFavQukn5I3uwvXZO3/9Ces071tYWFeeKow7FywZf
// SIG // hyAG1baJXmvkn0aHVxFFfIZbfQIDAQABo4IBCTCCAQUw
// SIG // HQYDVR0OBBYEFHGevhS+zas6s3KOm7NHXnUhRcIuMB8G
// SIG // A1UdIwQYMBaAFCM0+NlSRnAK7UD7dvuzK7DDNbMPMFQG
// SIG // A1UdHwRNMEswSaBHoEWGQ2h0dHA6Ly9jcmwubWljcm9z
// SIG // b2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3RzL01pY3Jvc29m
// SIG // dFRpbWVTdGFtcFBDQS5jcmwwWAYIKwYBBQUHAQEETDBK
// SIG // MEgGCCsGAQUFBzAChjxodHRwOi8vd3d3Lm1pY3Jvc29m
// SIG // dC5jb20vcGtpL2NlcnRzL01pY3Jvc29mdFRpbWVTdGFt
// SIG // cFBDQS5jcnQwEwYDVR0lBAwwCgYIKwYBBQUHAwgwDQYJ
// SIG // KoZIhvcNAQEFBQADggEBAJm4QdJYOju+gNVM+/p9BVw5
// SIG // xJXv3jPyYjz5O6TV4qZviA2nFXZaYlG3WszDCDiJGUwM
// SIG // c1kmXM24JGrXyoS56AP7bSHwa8x9iV6aOAQpZp4YuYnG
// SIG // BuhDO5kKZSTuvq42ybEtTI0930nEIQEJ7/chHQZoN1WG
// SIG // rkrllooUrnW3hk7XZIYn4JTcEd5aP6pzH+cu0N+YE6U+
// SIG // +QjCu8vSAPmSydTBrSxLTVoRiSlbm8m8osl1YYg93mwj
// SIG // rjAA+U4wDpZ4fclP9WbwT/Ohwry4cVeNV9kD08VbHfaG
// SIG // joX1ybzJpC7nvp265kt1U37hdu/O9Hv2S1MUmLjmNIch
// SIG // 3TR8gpHX7LowggTbMIIDw6ADAgECAhMzAAABsd3tulTp
// SIG // ZbhfAAEAAAGxMA0GCSqGSIb3DQEBBQUAMHkxCzAJBgNV
// SIG // BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYD
// SIG // VQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQg
// SIG // Q29ycG9yYXRpb24xIzAhBgNVBAMTGk1pY3Jvc29mdCBD
// SIG // b2RlIFNpZ25pbmcgUENBMB4XDTE4MDcxMjIwMTExOVoX
// SIG // DTE5MDcyNjIwMTExOVowdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // m1K+Tyy0HVPLPV0jHraDo5/A5UrgV7PC+C3WipFfzBLO
// SIG // DN0Ct0Z49Gub3ufLICGP1D4OJZRyOnhjZi61X+Hbl/2I
// SIG // jqiIl1VMHR4+qWlJLRNj+X7DparTv3/CBzkhMGY2lZdv
// SIG // p96rpRL2heloKGkmmxqet6/sU3hvw8wxMIf29zYrMEBZ
// SIG // SEaAUajNDIDd40qeLXRV7OanRHrVE770wiR9DP0zzeYj
// SIG // X5rN1CltAtUyWmonz7DJAYuUr+UMi3offSITg4byWkvT
// SIG // hGNXGmtJeDpU6Y/hhcblP5Yl5175yMvHofLyGw0iW7kv
// SIG // /Izp2yjEVRe26PTXes/9nNOP7ul2KoKMoQIDAQABo4IB
// SIG // XzCCAVswEwYDVR0lBAwwCgYIKwYBBQUHAwMwHQYDVR0O
// SIG // BBYEFEQTtAKddz6QVXH15Bx/rBcUzz5zMFAGA1UdEQRJ
// SIG // MEekRTBDMSkwJwYDVQQLEyBNaWNyb3NvZnQgT3BlcmF0
// SIG // aW9ucyBQdWVydG8gUmljbzEWMBQGA1UEBRMNMjI5ODAz
// SIG // KzQzNzk1MDAfBgNVHSMEGDAWgBTLEejK0rQWWAHJNy4z
// SIG // Fha5TJoKHzBWBgNVHR8ETzBNMEugSaBHhkVodHRwOi8v
// SIG // Y3JsLm1pY3Jvc29mdC5jb20vcGtpL2NybC9wcm9kdWN0
// SIG // cy9NaWNDb2RTaWdQQ0FfMDgtMzEtMjAxMC5jcmwwWgYI
// SIG // KwYBBQUHAQEETjBMMEoGCCsGAQUFBzAChj5odHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRzL01pY0Nv
// SIG // ZFNpZ1BDQV8wOC0zMS0yMDEwLmNydDANBgkqhkiG9w0B
// SIG // AQUFAAOCAQEAg6nypjPFoXsc0l6AruykpsPpKF1XJSON
// SIG // 3SUJaXDoTWkWL5S7BdmbgOxZ0GhkG4M0qNzPY42da3YA
// SIG // 9XuvQnQHxfyRwOKsRTOWXbH9+o5GskniQwYZmIVxeNOe
// SIG // 6duVFkExNHAsQ5aiAnepLz1hSmNZ8Zd90VKVYIWovBtF
// SIG // Bz/ZwY/3UPW5fgiJ5ELEWI5BwJU4SR/XHfgwTykvO0dZ
// SIG // kjfulyHtF2aQHC8tbWv/C3XlqhLd+q/EEbTgITJavwXO
// SIG // Rfk/jVauzlHWzK59BBkwEvK/n0gmnA4ADSitpd5ELczU
// SIG // h/+USZVXDE00nCMK3cONMgn0vTUoxd7QiD+pEhOhMHCg
// SIG // ETCCBbwwggOkoAMCAQICCmEzJhoAAAAAADEwDQYJKoZI
// SIG // hvcNAQEFBQAwXzETMBEGCgmSJomT8ixkARkWA2NvbTEZ
// SIG // MBcGCgmSJomT8ixkARkWCW1pY3Jvc29mdDEtMCsGA1UE
// SIG // AxMkTWljcm9zb2Z0IFJvb3QgQ2VydGlmaWNhdGUgQXV0
// SIG // aG9yaXR5MB4XDTEwMDgzMTIyMTkzMloXDTIwMDgzMTIy
// SIG // MjkzMloweTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEjMCEGA1UE
// SIG // AxMaTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0EwggEi
// SIG // MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCycllc
// SIG // GTBkvx2aYCAgQpl2U2w+G9ZvzMvx6mv+lxYQ4N86dIMa
// SIG // ty+gMuz/3sJCTiPVcgDbNVcKicquIEn08GisTUuNpb15
// SIG // S3GbRwfa/SXfnXWIz6pzRH/XgdvzvfI2pMlcRdyvrT3g
// SIG // KGiXGqelcnNW8ReU5P01lHKg1nZfHndFg4U4FtBzWwW6
// SIG // Z1KNpbJpL9oZC/6SdCnidi9U3RQwWfjSjWL9y8lfRjFQ
// SIG // uScT5EAwz3IpECgixzdOPaAyPZDNoTgGhVxOVoIoKgUy
// SIG // t0vXT2Pn0i1i8UU956wIAPZGoZ7RW4wmU+h6qkryRs83
// SIG // PDietHdcpReejcsRj1Y8wawJXwPTAgMBAAGjggFeMIIB
// SIG // WjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTLEejK
// SIG // 0rQWWAHJNy4zFha5TJoKHzALBgNVHQ8EBAMCAYYwEgYJ
// SIG // KwYBBAGCNxUBBAUCAwEAATAjBgkrBgEEAYI3FQIEFgQU
// SIG // /dExTtMmipXhmGA7qDFvpjy82C0wGQYJKwYBBAGCNxQC
// SIG // BAweCgBTAHUAYgBDAEEwHwYDVR0jBBgwFoAUDqyCYEBW
// SIG // J5flJRP8KuEKU5VZ5KQwUAYDVR0fBEkwRzBFoEOgQYY/
// SIG // aHR0cDovL2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwv
// SIG // cHJvZHVjdHMvbWljcm9zb2Z0cm9vdGNlcnQuY3JsMFQG
// SIG // CCsGAQUFBwEBBEgwRjBEBggrBgEFBQcwAoY4aHR0cDov
// SIG // L3d3dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNy
// SIG // b3NvZnRSb290Q2VydC5jcnQwDQYJKoZIhvcNAQEFBQAD
// SIG // ggIBAFk5Pn8mRq/rb0CxMrVq6w4vbqhJ9+tfde1MOy3X
// SIG // Q60L/svpLTGjI8x8UJiAIV2sPS9MuqKoVpzjcLu4tPh5
// SIG // tUly9z7qQX/K4QwXaculnCAt+gtQxFbNLeNK0rxw56gN
// SIG // ogOlVuC4iktX8pVCnPHz7+7jhh80PLhWmvBTI4UqpIIc
// SIG // k+KUBx3y4k74jKHK6BOlkU7IG9KPcpUqcW2bGvgc8FPW
// SIG // Z8wi/1wdzaKMvSeyeWNWRKJRzfnpo1hW3ZsCRUQvX/Ta
// SIG // rtSCMm78pJUT5Otp56miLL7IKxAOZY6Z2/Wi+hImCWU4
// SIG // lPF6H0q70eFW6NB4lhhcyTUWX92THUmOLb6tNEQc7hAV
// SIG // GgBd3TVbIc6YxwnuhQ6MT20OE049fClInHLR82zKwexw
// SIG // o1eSV32UjaAbSANa98+jZwp0pTbtLS8XyOZyNxL0b7E8
// SIG // Z4L5UrKNMxZlHg6K3RDeZPRvzkbU0xfpecQEtNP7LN8f
// SIG // ip6sCvsTJ0Ct5PnhqX9GuwdgR2VgQE6wQuxO7bN2edgK
// SIG // NAltHIAxH+IOVN3lofvlRxCtZJj/UBYufL8FIXrilUEn
// SIG // acOTj5XJjdibIa4NXJzwoq6GaIMMai27dmsAHZat8hZ7
// SIG // 9haDJLmIz2qoRzEvmtzjcT3XAH5iR9HOiMm4GPoOco3B
// SIG // oz2vAkBq/2mbluIQqBC0N1AI1sM9MIIGBzCCA++gAwIB
// SIG // AgIKYRZoNAAAAAAAHDANBgkqhkiG9w0BAQUFADBfMRMw
// SIG // EQYKCZImiZPyLGQBGRYDY29tMRkwFwYKCZImiZPyLGQB
// SIG // GRYJbWljcm9zb2Z0MS0wKwYDVQQDEyRNaWNyb3NvZnQg
// SIG // Um9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkwHhcNMDcw
// SIG // NDAzMTI1MzA5WhcNMjEwNDAzMTMwMzA5WjB3MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSEwHwYDVQQDExhNaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EwggEiMA0GCSqGSIb3DQEBAQUA
// SIG // A4IBDwAwggEKAoIBAQCfoWyx39tIkip8ay4Z4b3i48WZ
// SIG // USNQrc7dGE4kD+7Rp9FMrXQwIBHrB9VUlRVJlBtCkq6Y
// SIG // XDAm2gBr6Hu97IkHD/cOBJjwicwfyzMkh53y9GccLPx7
// SIG // 54gd6udOo6HBI1PKjfpFzwnQXq/QsEIEovmmbJNn1yjc
// SIG // RlOwhtDlKEYuJ6yGT1VSDOQDLPtqkJAwbofzWTCd+n7W
// SIG // l7PoIZd++NIT8wi3U21StEWQn0gASkdmEScpZqiX5NMG
// SIG // gUqi+YSnEUcUCYKfhO1VeP4Bmh1QCIUAEDBG7bfeI0a7
// SIG // xC1Un68eeEExd8yb3zuDk6FhArUdDbH895uyAc4iS1T/
// SIG // +QXDwiALAgMBAAGjggGrMIIBpzAPBgNVHRMBAf8EBTAD
// SIG // AQH/MB0GA1UdDgQWBBQjNPjZUkZwCu1A+3b7syuwwzWz
// SIG // DzALBgNVHQ8EBAMCAYYwEAYJKwYBBAGCNxUBBAMCAQAw
// SIG // gZgGA1UdIwSBkDCBjYAUDqyCYEBWJ5flJRP8KuEKU5VZ
// SIG // 5KShY6RhMF8xEzARBgoJkiaJk/IsZAEZFgNjb20xGTAX
// SIG // BgoJkiaJk/IsZAEZFgltaWNyb3NvZnQxLTArBgNVBAMT
// SIG // JE1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhv
// SIG // cml0eYIQea0WoUqgpa1Mc1j0BxMuZTBQBgNVHR8ESTBH
// SIG // MEWgQ6BBhj9odHRwOi8vY3JsLm1pY3Jvc29mdC5jb20v
// SIG // cGtpL2NybC9wcm9kdWN0cy9taWNyb3NvZnRyb290Y2Vy
// SIG // dC5jcmwwVAYIKwYBBQUHAQEESDBGMEQGCCsGAQUFBzAC
// SIG // hjhodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpL2Nl
// SIG // cnRzL01pY3Jvc29mdFJvb3RDZXJ0LmNydDATBgNVHSUE
// SIG // DDAKBggrBgEFBQcDCDANBgkqhkiG9w0BAQUFAAOCAgEA
// SIG // EJeKw1wDRDbd6bStd9vOeVFNAbEudHFbbQwTq86+e4+4
// SIG // LtQSooxtYrhXAstOIBNQmd16QOJXu69YmhzhHQGGrLt4
// SIG // 8ovQ7DsB7uK+jwoFyI1I4vBTFd1Pq5Lk541q1YDB5pTy
// SIG // Bi+FA+mRKiQicPv2/OR4mS4N9wficLwYTp2Oawpylbih
// SIG // OZxnLcVRDupiXD8WmIsgP+IHGjL5zDFKdjE9K3ILyOpw
// SIG // Pf+FChPfwgphjvDXuBfrTot/xTUrXqO/67x9C0J71FNy
// SIG // Ie4wyrt4ZVxbARcKFA7S2hSY9Ty5ZlizLS/n+YWGzFFW
// SIG // 6J1wlGysOUzU9nm/qhh6YinvopspNAZ3GmLJPR5tH4Lw
// SIG // C8csu89Ds+X57H2146SodDW4TsVxIxImdgs8UoxxWkZD
// SIG // FLyzs7BNZ8ifQv+AeSGAnhUwZuhCEl4ayJ4iIdBD6Svp
// SIG // u/RIzCzU2DKATCYqSCRfWupW76bemZ3KOm+9gSd0BhHu
// SIG // diG/m4LBJ1S2sWo9iaF2YbRuoROmv6pH8BJv/YoybLL+
// SIG // 31HIjCPJZr2dHYcSZAI9La9Zj7jkIeW1sMpjtHhUBdRB
// SIG // LlCslLCleKuzoJZ1GtmShxN1Ii8yqAhuoFuMJb+g74TK
// SIG // IdbrHk/Jmu5J4PcBZW+JC33Iacjmbuqnl84xKf8OxVtc
// SIG // 2E0bodj6L54/LlUWa8kTo/0xggSJMIIEhQIBATCBkDB5
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSMwIQYDVQQDExpNaWNy
// SIG // b3NvZnQgQ29kZSBTaWduaW5nIFBDQQITMwAAAbHd7bpU
// SIG // 6WW4XwABAAABsTAJBgUrDgMCGgUAoIGiMBkGCSqGSIb3
// SIG // DQEJAzEMBgorBgEEAYI3AgEEMBwGCisGAQQBgjcCAQsx
// SIG // DjAMBgorBgEEAYI3AgEVMCMGCSqGSIb3DQEJBDEWBBQm
// SIG // uzIbOEYfj9GY1hDm96mmGXFiyzBCBgorBgEEAYI3AgEM
// SIG // MTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAYaHR0
// SIG // cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3DQEB
// SIG // AQUABIIBACi5OEuSUpX7eWznETebAxoZ7FR7hsIvoH+N
// SIG // YJec9lIFmVzcsr868IIi1F732/xoXElfq094MEAKMFNC
// SIG // +GUYD7WMmH6KkveS5SiVBwB2WwDMy/2JmwcIze4unX3D
// SIG // 4gPqYb/F2Ad9K7lASL9HYYYG/GM8d8Wq5o6kPIXe69Pf
// SIG // nW6Zc0PdNwlH0+TMl7msrl6jgzf/e2bqSNSI11tg/cHa
// SIG // QRVY+ORDmtVlmO3ZN3jYv4yvGSAaFaNuMSSU0vHT+0OE
// SIG // 4Yty21ryH4GOAJY6Wg/lmbiW8jnquK9RPTHg4qH1PeQO
// SIG // P2KR1biFwb7TWa715doL5LTcH+mkE4sw9OWu2+9kO9Wh
// SIG // ggIoMIICJAYJKoZIhvcNAQkGMYICFTCCAhECAQEwgY4w
// SIG // dzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBAhMzAAABIU6yA00/
// SIG // JGk2AAAAAAEhMAkGBSsOAwIaBQCgXTAYBgkqhkiG9w0B
// SIG // CQMxCwYJKoZIhvcNAQcBMBwGCSqGSIb3DQEJBTEPFw0x
// SIG // OTA2MDMxNzMwMTFaMCMGCSqGSIb3DQEJBDEWBBQddizu
// SIG // 9l86P/taViVfTAOwCmPjMzANBgkqhkiG9w0BAQUFAASC
// SIG // AQCZvAwwmVDdPyOM/pT7hOef5mInoJBJojhxMn+vBAdo
// SIG // GygYdmmawZlQAvVErMidDY3nbF8QXceYi9a3hE9q0vVK
// SIG // rm0I09E+LavUgM9ovQwczcrTDxO8xV49ygs1s9uVpJBW
// SIG // VcD52EnVpAXhGRG8KBKSj0lFgO4OVWWhbRtHphcSOgk4
// SIG // 4TKoqNotjI2w8192SRf2QYJNEdkkOtJCONQN5nB3ntlU
// SIG // +HhaN2oTsmTHWPe5bBxDhrQmFmcGZsUruKYOxcyttcs1
// SIG // faJdCyFzHZ2CgBsY9SttAoqKtxbj2j/5k+sSVaTm6bQQ
// SIG // QXs0h2C1rfY2tPs7dJwmdyLzEKBDG5HQmJYL
// SIG // End signature block
