// 
// Updates an ApplicationHost.config file in the current user's
// profile directory from IIS 7.5 Express to IIS 10.0 Express.
// 

var strCommitPath = "MACHINE/WEBROOT/APPHOST";
var strFirstItem  = "##FIRST#ITEM##";
var strLastItem   = "##LAST#ITEM##";

// ------------------------------------------------------------
// Check for an existing ApplicationHost.config file.
// ------------------------------------------------------------

var objFSO = new ActiveXObject("scripting.filesystemobject");
var strUserConfig = GetUserDirectory() + "\\config\\ApplicationHost.config";
if (objFSO.FileExists(strUserConfig))
{
	// Backup existing an existing ApplicationHost.config file.
	try
	{
		var dtmDate = new Date();
		var strDate = dtmDate.getYear().toString() + 
			PadNumber(dtmDate.getMonth()+1) + 
			PadNumber(dtmDate.getDate()) + 
			PadNumber(dtmDate.getHours()) + 
			PadNumber(dtmDate.getMinutes()) + 
			PadNumber(dtmDate.getSeconds());
	 	objFSO.CopyFile(strUserConfig,strUserConfig + "." + strDate + ".bak",true);
	}
	catch(e)
	{
		ErrorMessage(e,"An error occurred trying to back up your ApplicationHost.config file");
	}
}
else
{
	// Exit if no applicationhost.config file exists. (This is not an error condition.)
	WScript.Echo("No ApplicationHost.config file exists in the current user's profile directory - exiting.");
	WScript.Quit(0);
}

// ------------------------------------------------------------
// Retrieve the necessary objects for the rest of the script.
// ------------------------------------------------------------

WScript.Echo("Migrating your ApplicationHost.config file...\n");
var objAdminManager      = GetAdminManager();
var objConfigManager     = objAdminManager.ConfigManager;
var objAppHostConfig     = objConfigManager.GetConfigFile(strCommitPath);
var objRootSectionGroup  = objAppHostConfig.RootSectionGroup;

// ------------------------------------------------------------
WScript.Echo("...adding new section groups...");
// ------------------------------------------------------------

var objSystemWebServer = FindSectionGroup(objRootSectionGroup,"system.webServer");
AddSection(objSystemWebServer,"applicationInitialization","Allow","MachineToApplication","");
AddSection(objSystemWebServer,"webSocket","Deny","","");
var objSecurity = FindSectionGroup(objSystemWebServer,"security");
AddSection(objSecurity,"dynamicIpSecurity","Deny","","");

// ------------------------------------------------------------
WScript.Echo("...adding new global modules...");
// ------------------------------------------------------------

var objGlobalModules = objAdminManager.GetAdminSection("system.webServer/globalModules", strCommitPath);
AddGlobalModule(objGlobalModules.Collection,"DynamicIpRestrictionModule","%IIS_BIN%\\diprestr.dll","","IpRestrictionModule");
AddGlobalModule(objGlobalModules.Collection,"ApplicationInitializationModule","%IIS_BIN%\\warmup.dll","","ConfigurationValidationModule");
AddGlobalModule(objGlobalModules.Collection,"WebSocketModule","%IIS_BIN%\\iiswsock.dll","","ApplicationInitializationModule");
AddGlobalModule(objGlobalModules.Collection,"ManagedEngine64","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\webengine.dll","integratedMode,runtimeVersionv2.0,bitness64","ManagedEngine");
AddGlobalModule(objGlobalModules.Collection,"ManagedEngineV4.0_64bit","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\webengine4.dll","integratedMode,runtimeVersionv4.0,bitness64","ManagedEngineV4.0_32bit");

// ------------------------------------------------------------
WScript.Echo("...adding new ISAPI filters...");
// ------------------------------------------------------------

var objIsapiFilters = objAdminManager.GetAdminSection("system.webServer/isapiFilters", strCommitPath);
AddIsapiFilter(objIsapiFilters.Collection,"ASP.Net_2.0.50727-64","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_filter.dll","","true","bitness64,runtimeVersionv2.0",strFirstItem);
AddIsapiFilter(objIsapiFilters.Collection,"ASP.Net_4.0_64bit","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_filter.dll","","true","bitness64,runtimeVersionv4.0","ASP.Net_4.0_32bit");

// ------------------------------------------------------------
WScript.Echo("...adding new ISAPI/CGI restrictions...");
// ------------------------------------------------------------

var objIsapiCgiRestrictions = objAdminManager.GetAdminSection("system.webServer/security/isapiCgiRestriction", strCommitPath);
AddIsapiCgiRestriction(objIsapiCgiRestrictions.Collection,"%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\webengine4.dll","true","ASP.NET_v4.0","ASP.NET_v4.0",strFirstItem);
AddIsapiCgiRestriction(objIsapiCgiRestrictions.Collection,"%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll","true","ASP.NET v2.0.50727","ASP.NET v2.0.50727",strLastItem);
AddIsapiCgiRestriction(objIsapiCgiRestrictions.Collection,"%windir%\\Microsoft.NET\\Framework\\v2.0.50727\\aspnet_isapi.dll","true","ASP.NET v2.0.50727","ASP.NET v2.0.50727",strLastItem);

// ------------------------------------------------------------
WScript.Echo("...adding new MIME maps...");
// ------------------------------------------------------------

var objStaticContent = objAdminManager.GetAdminSection("system.webServer/staticContent", strCommitPath);
AddMimeMap(objStaticContent.Collection,".3g2","video/3gpp2");
AddMimeMap(objStaticContent.Collection,".3gp2","video/3gpp2");
AddMimeMap(objStaticContent.Collection,".3gp","video/3gpp");
AddMimeMap(objStaticContent.Collection,".3gpp","video/3gpp");
AddMimeMap(objStaticContent.Collection,".aac","audio/aac");
AddMimeMap(objStaticContent.Collection,".adt","audio/vnd.dlna.adts");
AddMimeMap(objStaticContent.Collection,".adts","audio/vnd.dlna.adts");
AddMimeMap(objStaticContent.Collection,".cab","application/vnd.ms-cab-compressed");
AddMimeMap(objStaticContent.Collection,".dvr-ms","video/x-ms-dvr");
AddMimeMap(objStaticContent.Collection,".eot","application/vnd.ms-fontobject");
AddMimeMap(objStaticContent.Collection,".js","application/javascript");
AddMimeMap(objStaticContent.Collection,".m2ts","video/vnd.dlna.mpeg-tts");
AddMimeMap(objStaticContent.Collection,".m4a","audio/mp4");
AddMimeMap(objStaticContent.Collection,".m4v","video/mp4");
AddMimeMap(objStaticContent.Collection,".mp4","video/mp4");
AddMimeMap(objStaticContent.Collection,".mp4v","video/mp4");
AddMimeMap(objStaticContent.Collection,".oga","audio/ogg");
AddMimeMap(objStaticContent.Collection,".ogg","video/ogg");
AddMimeMap(objStaticContent.Collection,".ogv","video/ogg");
AddMimeMap(objStaticContent.Collection,".ogx","application/ogg");
AddMimeMap(objStaticContent.Collection,".otf","font/otf");
AddMimeMap(objStaticContent.Collection,".spx","audio/ogg");
AddMimeMap(objStaticContent.Collection,".svg","image/svg+xml");
AddMimeMap(objStaticContent.Collection,".svgz","image/svg+xml");
AddMimeMap(objStaticContent.Collection,".ts","video/vnd.dlna.mpeg-tts");
AddMimeMap(objStaticContent.Collection,".tts","video/vnd.dlna.mpeg-tts");
AddMimeMap(objStaticContent.Collection,".webm","video/webm");
AddMimeMap(objStaticContent.Collection,".woff","font/x-woff");
AddMimeMap(objStaticContent.Collection,".wtv","video/x-ms-wtv");
AddMimeMap(objStaticContent.Collection,".xht","application/xhtml+xml");
AddMimeMap(objStaticContent.Collection,".xhtml","application/xhtml+xml");

// ------------------------------------------------------------
WScript.Echo("...adding new trace provider definitions...");
// ------------------------------------------------------------

var objTraceProviderDefinitions = objAdminManager.GetAdminSection("system.webServer/tracing/traceProviderDefinitions", strCommitPath);
AddTraceProviderDefinitions(objTraceProviderDefinitions.Collection,"WWW Server","WebSocket","16384");

// ------------------------------------------------------------
WScript.Echo("...updating trace areas...");
// ------------------------------------------------------------

var objTraceAreas = objAdminManager.GetAdminSection("system.webServer/tracing/traceFailedRequests", strCommitPath);
UpdateTraceAreas(objTraceAreas.Collection,"WWW Server","Authentication,Security,Filter,StaticFile,CGI,Compression,Cache,RequestNotifications,Module,Rewrite,WebSocket","Verbose");

// ------------------------------------------------------------
WScript.Echo("...updating WebDAV global settings...");
// ------------------------------------------------------------

var objWebDavGlobalSettings = objAdminManager.GetAdminSection("system.webServer/webdav/globalSettings", strCommitPath);
UpdateWebDavGlobalSettings(objWebDavGlobalSettings.ChildElements.Item("propertyStores").Collection,"webdav_simple_prop","%IIS_BIN%\\webdav_simple_prop.dll","%IIS_BIN%\\webdav_simple_prop.dll");
UpdateWebDavGlobalSettings(objWebDavGlobalSettings.ChildElements.Item("lockStores").Collection,"webdav_simple_lock","%IIS_BIN%\\webdav_simple_lock.dll","%IIS_BIN%\\webdav_simple_lock.dll");

// ------------------------------------------------------------
WScript.Echo("...adding new modules...");
// ------------------------------------------------------------

var objModules = objAdminManager.GetAdminSection("system.webServer/modules", strCommitPath);
AddModule(objModules.Collection,"WebMatrixSupportModule","true","","","IISCertificateMappingAuthenticationModule");
AddModule(objModules.Collection,"DynamicIpRestrictionModule","true","","","IpRestrictionModule");
AddModule(objModules.Collection,"ApplicationInitializationModule","true","","","UrlMappingsModule");
AddModule(objModules.Collection,"WebSocketModule","true","","","ApplicationInitializationModule");
AddModule(objModules.Collection,"ConfigurationValidationModule","true","","","ServiceModel-4.0");

// ------------------------------------------------------------
WScript.Echo("...adding new handlers...");
// ------------------------------------------------------------

var objHandlers = objAdminManager.GetAdminSection("system.webServer/handlers", strCommitPath);
AddHandler(objHandlers.Collection,"vbhtml-ISAPI-4.0_64bit","*.vbhtml","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"vbhtm-ISAPI-4.0_64bit","*.vbhtm","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"cshtml-ISAPI-4.0_64bit","*.cshtml","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"cshtm-ISAPI-4.0_64bit","*.cshtm","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"aspq-ISAPI-4.0_64bit","*.aspq","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"xamlx-ISAPI-4.0_64bit","*.xamlx","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","","",strFirstItem);
AddHandler(objHandlers.Collection,"xoml-ISAPI-4.0_64bit","*.xoml","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","","",strFirstItem);
AddHandler(objHandlers.Collection,"rules-ISAPI-4.0_64bit","*.rules","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","","",strFirstItem);
AddHandler(objHandlers.Collection,"svc-ISAPI-4.0_64bit","*.svc","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","","",strFirstItem);
AddHandler(objHandlers.Collection,"HttpRemotingHandlerFactory-soap-ISAPI-4.0_64bit","*.soap","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"HttpRemotingHandlerFactory-rem-ISAPI-4.0_64bit","*.rem","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"WebServiceHandlerFactory-ISAPI-4.0_64bit","*.asmx","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"SimpleHandlerFactory-ISAPI-4.0_64bit","*.ashx","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"PageHandlerFactory-ISAPI-4.0_64bit","*.aspx","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"AXD-ISAPI-4.0_64bit","*.axd","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","",strFirstItem);
AddHandler(objHandlers.Collection,"svc-ISAPI-4.0_32bit","*.svc","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness32","","","HttpRemotingHandlerFactory-soap-ISAPI-4.0_32bit");
AddHandler(objHandlers.Collection,"rules-ISAPI-4.0_32bit","*.rules","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness32","","","svc-ISAPI-4.0_32bit");
AddHandler(objHandlers.Collection,"xoml-ISAPI-4.0_32bit","*.xoml","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness32","","","rules-ISAPI-4.0_32bit");
AddHandler(objHandlers.Collection,"xamlx-ISAPI-4.0_32bit","*.xamlx","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness32","","","xoml-ISAPI-4.0_32bit");
AddHandler(objHandlers.Collection,"aspq-ISAPI-4.0_32bit","*.aspq","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness32","0","","xamlx-ISAPI-4.0_32bit");
AddHandler(objHandlers.Collection,"ScriptResourceIntegrated-4.0","*ScriptResource.axd","GET,HEAD","","System.Web.Handlers.ScriptResourceHandler, System.Web.Extensions, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31BF3856AD364E35","","integratedMode,runtimeVersionv4.0","","","ScriptHandlerFactoryAppServices-Integrated-4.0");
AddHandler(objHandlers.Collection,"TraceHandler-Integrated","trace.axd","GET,HEAD,POST,DEBUG","","System.Web.Handlers.TraceHandler","","integratedMode,runtimeVersionv2.0","","","ISAPI-dll");
AddHandler(objHandlers.Collection,"WebAdminHandler-Integrated","WebAdmin.axd","GET,DEBUG","","System.Web.Handlers.WebAdminHandler","","integratedMode,runtimeVersionv2.0","","","TraceHandler-Integrated");
AddHandler(objHandlers.Collection,"AssemblyResourceLoader-Integrated","WebResource.axd","GET,DEBUG","","System.Web.Handlers.AssemblyResourceLoader","","integratedMode,runtimeVersionv2.0","","","WebAdminHandler-Integrated");
AddHandler(objHandlers.Collection,"PageHandlerFactory-Integrated","*.aspx","GET,HEAD,POST,DEBUG","","System.Web.UI.PageHandlerFactory","","integratedMode,runtimeVersionv2.0","","","AssemblyResourceLoader-Integrated");
AddHandler(objHandlers.Collection,"SimpleHandlerFactory-Integrated","*.ashx","GET,HEAD,POST,DEBUG","","System.Web.UI.SimpleHandlerFactory","","integratedMode,runtimeVersionv2.0","","","PageHandlerFactory-Integrated");
AddHandler(objHandlers.Collection,"svc-ISAPI-2.0-64","*.svc","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll","classicMode,runtimeVersionv2.0,bitness64","","","HttpRemotingHandlerFactory-soap-ISAPI-2.0");
AddHandler(objHandlers.Collection,"AXD-ISAPI-2.0-64","*.axd","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll","classicMode,runtimeVersionv2.0,bitness64","0","","svc-ISAPI-2.0-64");
AddHandler(objHandlers.Collection,"PageHandlerFactory-ISAPI-2.0-64","*.aspx","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll","classicMode,runtimeVersionv2.0,bitness64","0","","AXD-ISAPI-2.0-64");
AddHandler(objHandlers.Collection,"SimpleHandlerFactory-ISAPI-2.0-64","*.ashx","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll","classicMode,runtimeVersionv2.0,bitness64","0","","PageHandlerFactory-ISAPI-2.0-64");
AddHandler(objHandlers.Collection,"WebServiceHandlerFactory-ISAPI-2.0-64","*.asmx","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll","classicMode,runtimeVersionv2.0,bitness64","0","","SimpleHandlerFactory-ISAPI-2.0-64");
AddHandler(objHandlers.Collection,"HttpRemotingHandlerFactory-rem-ISAPI-2.0-64","*.rem","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll","classicMode,runtimeVersionv2.0,bitness64","0","","WebServiceHandlerFactory-ISAPI-2.0-64");
AddHandler(objHandlers.Collection,"HttpRemotingHandlerFactory-soap-ISAPI-2.0-64","*.soap","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll","classicMode,runtimeVersionv2.0,bitness64","0","","HttpRemotingHandlerFactory-rem-ISAPI-2.0-64");
AddHandler(objHandlers.Collection,"rules-64-ISAPI-2.0","*.rules","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll","classicMode,runtimeVersionv2.0,bitness64","","","HttpRemotingHandlerFactory-soap-ISAPI-2.0-64");
AddHandler(objHandlers.Collection,"xoml-64-ISAPI-2.0","*.xoml","*","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v2.0.50727\\aspnet_isapi.dll","classicMode,runtimeVersionv2.0,bitness64","","","rules-64-ISAPI-2.0");
AddHandler(objHandlers.Collection,"SSINC-stm","*.stm","GET,HEAD,POST","ServerSideIncludeModule","","","","","File","CGI-exe");
AddHandler(objHandlers.Collection,"SSINC-shtm","*.shtm","GET,HEAD,POST","ServerSideIncludeModule","","","","","File","SSINC-stm");
AddHandler(objHandlers.Collection,"SSINC-shtml","*.shtml","GET,HEAD,POST","ServerSideIncludeModule","","","","","File","SSINC-shtm");
AddHandler(objHandlers.Collection,"ExtensionlessUrlHandler-ISAPI-4.0_64bit","*.","GET,HEAD,POST,DEBUG","IsapiModule","","%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\aspnet_isapi.dll","classicMode,runtimeVersionv4.0,bitness64","0","","ExtensionlessUrl-ISAPI-4.0_32bit");
AddHandler(objHandlers.Collection,"ExtensionlessUrl-Integrated-4.0","*.","GET,HEAD,POST,DEBUG","","System.Web.Handlers.TransferRequestHandler","","integratedMode,runtimeVersionv4.0","0","","ExtensionlessUrlHandler-ISAPI-4.0_64bit");

// ------------------------------------------------------------
// Commit changes and exit.
// ------------------------------------------------------------

try
{
	objAdminManager.CommitChanges();
}
catch(e)
{
	ErrorMessage(e,"An error occurred trying to commit the changes");
}

WScript.Echo("\nFinished!");
WScript.Quit(0);

// ================================================================================

function AddSection(tmpSectionGroup,tmpSectionName,tmpOverrideModeDefault,tmpAllowDefinition,tmpAllowLocation)
{
	try
	{
		// Retrieve the index within the collection.
		var tmpElementPosition = FindElement2(tmpSectionGroup.sections,tmpSectionName);
		var tmpNewSection = null;
		if (tmpElementPosition == -1)
		{
			tmpNewSection = tmpSectionGroup.Sections.AddSection(tmpSectionName);
		}
		else
		{
			tmpNewSection = tmpSectionGroup.Sections.Item(tmpElementPosition);
		}
		// Add the required attributes.
		tmpNewSection.OverrideModeDefault = tmpOverrideModeDefault;
		tmpNewSection.AllowDefinition = tmpAllowDefinition;
		tmpNewSection.AllowLocation = tmpAllowLocation;
	}
	catch(e)
	{
		ErrorMessage(e,"An error occurred trying to add a section");
	}
}

// ================================================================================

function AddGlobalModule(tmpModuleGroup,tmpModuleName,tmpImage,tmpPreCondition,tmpPreviousModuleName)
{
	try
	{
		// Retrieve the index within the collection.
		var tmpElementPosition = FindElement1(tmpModuleGroup,"add",["name",tmpModuleName]);
		// Delete the item if it already exists.
		if (tmpElementPosition != -1) tmpModuleGroup.DeleteElement(tmpElementPosition);
		// Create a new element
		var tmpNewElement = tmpModuleGroup.CreateNewElement("add");
		// Add the required properties.
		tmpNewElement.Properties.Item("name").Value = tmpModuleName;
		tmpNewElement.Properties.Item("image").Value = tmpImage;
		// Add any optional properties.
		if (tmpPreCondition.length != 0) tmpNewElement.Properties.Item("preCondition").Value = tmpPreCondition;
		// Retrieve the previous index within the collection.
		tmpElementPosition = FindElement3(tmpModuleGroup,tmpPreviousModuleName);
		// Add the new element.
		tmpModuleGroup.AddElement(tmpNewElement, tmpElementPosition + ((tmpElementPosition>0) ? 1 : 0));
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to add a global module");
	}
}

// ================================================================================

function AddIsapiFilter(tmpIsapiFilterCollection,tmpName,tmpPath,tmpEnabled,tmpEnableCache,tmpPreCondition,tmpPreviousFilterName)
{
	try
	{
		// Retrieve the index within the collection.
		var tmpElementPosition = FindElement1(tmpIsapiFilterCollection,"filter",["name",tmpName]);
		// Delete the item if it already exists.
		if (tmpElementPosition != -1) tmpIsapiFilterCollection.DeleteElement(tmpElementPosition);
		// Create a new element
		var tmpNewElement = tmpIsapiFilterCollection.CreateNewElement("filter");
		// Add the required properties.
		tmpNewElement.Properties.Item("name").Value = tmpName;
		tmpNewElement.Properties.Item("path").Value = tmpPath;
		// Add any optional properties.
		if (tmpEnabled.length != 0) tmpNewElement.Properties.Item("enabled").Value = tmpEnabled;
		if (tmpEnableCache.length != 0) tmpNewElement.Properties.Item("enableCache").Value = tmpEnableCache;
		if (tmpPreCondition.length != 0) tmpNewElement.Properties.Item("preCondition").Value = tmpPreCondition;
		// Retrieve the previous index within the collection.
		tmpElementPosition = FindElement3(tmpIsapiFilterCollection,tmpPreviousFilterName);
		// Add the new element.
		tmpIsapiFilterCollection.AddElement(tmpNewElement, tmpElementPosition + ((tmpElementPosition>0) ? 1 : 0));
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to add an ISAPI filter");
	}
}

// ================================================================================

function AddIsapiCgiRestriction(tmpIsapiCgiRestrictionCollection,tmpPath,tmpAllowed,tmpGroupId,tmpDescription,tmpPrevious)
{
	try
	{
		// Retrieve the index within the collection.
		var tmpElementPosition = FindElement1(tmpIsapiCgiRestrictionCollection,"add",["path",tmpPath]);
		// Delete the item if it already exists.
		if (tmpElementPosition != -1) tmpIsapiCgiRestrictionCollection.DeleteElement(tmpElementPosition);
		// Create a new element
		var tmpNewElement = tmpIsapiCgiRestrictionCollection.CreateNewElement("add");
		// Add the required properties.
		tmpNewElement.Properties.Item("path").Value = tmpPath;
		tmpNewElement.Properties.Item("allowed").Value = tmpAllowed;
		// Add any optional properties.
		if (tmpGroupId.length != 0) tmpNewElement.Properties.Item("groupId").Value = tmpGroupId;
		if (tmpDescription.length != 0) tmpNewElement.Properties.Item("description").Value = tmpDescription;
		// Retrieve the previous index within the collection.
		tmpElementPosition = FindElement3(tmpIsapiCgiRestrictionCollection,tmpPrevious);
		// Add the new element.
		tmpIsapiCgiRestrictionCollection.AddElement(tmpNewElement, tmpElementPosition + ((tmpElementPosition>0) ? 1 : 0));
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to add an ISAPI/CGI restriction");
	}
}

// ================================================================================

function AddMimeMap(tmpStaticContentCollection,tmpFileExtension,tmpMimeType)
{
	try
	{
		// Retrieve the index within the collection.
		var tmpElementPosition = FindElement1(tmpStaticContentCollection,"mimeMap",["fileExtension",tmpFileExtension]);
		// Delete the item if it already exists.
		if (tmpElementPosition != -1) tmpStaticContentCollection.DeleteElement(tmpElementPosition);
		// Create a new element
		var tmpNewElement = tmpStaticContentCollection.CreateNewElement("mimeMap");
		// Add the required properties.
		tmpNewElement.Properties.Item("fileExtension").Value = tmpFileExtension;
		tmpNewElement.Properties.Item("mimeType").Value = tmpMimeType;
		// Add the new element.
		tmpStaticContentCollection.AddElement(tmpNewElement, -1);
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to add a MIME map");
	}
}

// ================================================================================

function AddTraceProviderDefinitions(tmpTraceProviderDefinitionCollection,tmpParent,tmpName,tmpValue)
{
	try
	{
		// Retrieve the index within the collection.
		var tmpElementPosition1 = FindElement1(tmpTraceProviderDefinitionCollection,"add",["name",tmpParent]);
		if (tmpElementPosition1 != -1)
		{
			var objWwwServerDefinitions = tmpTraceProviderDefinitionCollection.Item(tmpElementPosition1).ChildElements.Item(0).Collection;
			// Retrieve the index within the collection.
			var tmpElementPosition2 = FindElement1(objWwwServerDefinitions,"add",["name",tmpName]);
			// Delete the item if it already exists.
			if (tmpElementPosition2 != -1) objWwwServerDefinitions.DeleteElement(tmpElementPosition2);
			// Create a new element.
			var tmpNewElement = objWwwServerDefinitions.CreateNewElement("add");
			// Add the required properties.
			tmpNewElement.Properties.Item("name").Value = tmpName;
			tmpNewElement.Properties.Item("value").Value = tmpValue;
			// Add the new element.
			objWwwServerDefinitions.AddElement(tmpNewElement, -1);
		}
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to add a trace provider definition");
	}
}

// ================================================================================

function UpdateTraceAreas(tmpTraceAreasCollection,tmpProvider,tmpAreas,tmpVerbosity)
{
	try
	{
		// Retrieve the index within the collection.
		var objTraceAreas = tmpTraceAreasCollection.Item(0).ChildElements.Item(0).Collection;
		// Retrieve the index within the collection.
		var tmpElementPosition = FindElement1(objTraceAreas,"add",["provider",tmpProvider]);
		// Delete the item if it already exists.
		if (tmpElementPosition != -1) objTraceAreas.DeleteElement(tmpElementPosition);
		// Create a new element.
		var tmpNewElement = objTraceAreas.CreateNewElement("add");
		// Add the required properties.
		tmpNewElement.Properties.Item("provider").Value = tmpProvider;
		tmpNewElement.Properties.Item("areas").Value = tmpAreas;
		tmpNewElement.Properties.Item("verbosity").Value = tmpVerbosity;
		// Add the new element.
		objTraceAreas.AddElement(tmpNewElement, -1);
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to update the trace areas");
	}
}

// ================================================================================

function UpdateWebDavGlobalSettings(tmpWebDavStore,tmpName,tmpImage,tmpImage32)
{
	try
	{
		// Retrieve the index within the collection.
		var tmpElementPosition = FindElement1(tmpWebDavStore,"add",["name",tmpName]);
		// Delete the item if it already exists.
		if (tmpElementPosition != -1) tmpWebDavStore.DeleteElement(tmpElementPosition);
		// Create a new element.
		var tmpNewElement = tmpWebDavStore.CreateNewElement("add")
		// Add the required properties.
		tmpNewElement.Properties.Item("name").Value = tmpName;
		tmpNewElement.Properties.Item("image").Value = tmpImage;
		tmpNewElement.Properties.Item("image32").Value = tmpImage32;
		// Add the new element.
		tmpWebDavStore.AddElement(tmpNewElement, -1);
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to update the WebDAV settings");
	}
}

// ================================================================================

function AddModule(tmpModuleGroup,tmpModuleName,tmpLockItem,tmpType,tmpPreCondition,tmpPreviousModuleName)
{
	try
	{
		// Retrieve the index within the collection.
		var tmpElementPosition = FindElement1(tmpModuleGroup,"add",["name",tmpModuleName]);
		// Delete the item if it already exists.
		if (tmpElementPosition != -1) tmpModuleGroup.DeleteElement(tmpElementPosition);
		// Create a new element.
		var tmpNewElement = tmpModuleGroup.CreateNewElement("add");
		// Add the required properties.
		tmpNewElement.Properties.Item("name").Value = tmpModuleName;
		// Add any optional properties.
		if (tmpLockItem.length != 0) tmpNewElement.SetMetadata("lockItem", (tmpLockItem.toLowerCase() == "true") ? true : false );
		if (tmpType.length != 0) tmpNewElement.Properties.Item("type").Value = tmpType;
		if (tmpPreCondition.length != 0) tmpNewElement.Properties.Item("preCondition").Value = tmpPreCondition;
		// Retrieve the previous index within the collection.
		tmpElementPosition = FindElement3(tmpModuleGroup,tmpPreviousModuleName);
		// Add the new element.
		tmpModuleGroup.AddElement(tmpNewElement, tmpElementPosition + ((tmpElementPosition>0) ? 1 : 0));
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to add a module");
	}
}

// ================================================================================

function AddHandler(tmpHandlerCollection,tmpName,tmpPath,tmpVerb,tmpModules,tmpType,tmpScriptProcessor,tmpPreCondition,tmpPesponseBufferLimit,tmpResourceType,tmpPrevious)
{
	try
	{
		// Retrieve the index within the collection.
		var tmpElementPosition = FindElement1(tmpHandlerCollection,"add",["name",tmpName]);
		// Delete the item if it already exists.
		if (tmpElementPosition != -1) tmpHandlerCollection.DeleteElement(tmpElementPosition);
		// Create a new element.
		var tmpNewElement = tmpHandlerCollection.CreateNewElement("add");
		// Add the required properties.
		tmpNewElement.Properties.Item("name").Value = tmpName;
		tmpNewElement.Properties.Item("verb").Value = tmpVerb;
		tmpNewElement.Properties.Item("path").Value = tmpPath;
		// Add any optional properties.
		if (tmpType.length != 0) tmpNewElement.Properties.Item("type").Value = tmpType;
		if (tmpModules.length != 0) tmpNewElement.Properties.Item("modules").Value = tmpModules;
		if (tmpScriptProcessor.length != 0) tmpNewElement.Properties.Item("scriptProcessor").Value = tmpScriptProcessor;
		if (tmpPreCondition.length != 0) tmpNewElement.Properties.Item("preCondition").Value = tmpPreCondition;
		if (tmpPesponseBufferLimit.length != 0) tmpNewElement.Properties.Item("responseBufferLimit").Value = tmpPesponseBufferLimit;
		if (tmpResourceType.length != 0) tmpNewElement.Properties.Item("resourceType").Value = tmpResourceType;
		// Retrieve the previous index within the collection.
		tmpElementPosition = FindElement3(tmpHandlerCollection,tmpPrevious);
		// Add the new element.
		tmpHandlerCollection.AddElement(tmpNewElement, tmpElementPosition + ((tmpElementPosition>0) ? 1 : 0));
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to add a handler");
	}
}

// ================================================================================

function PadNumber(tmpNumber)
{
	return (tmpNumber < 10) ? ("0" + tmpNumber.toString()) : tmpNumber.toString();
}

// ================================================================================

function ErrorMessage(tmpError,tmpMessage)
{
	WScript.Echo("\n" + tmpMessage + ":\n" + tmpError.description);
	WScript.Quit(tmpError.number);
}

// ================================================================================

function GetAdminManager()
{
	try
	{
		var tmpVersionManager = WScript.CreateObject("Microsoft.IIS.VersionManager");
		var tmpVersionObject = tmpVersionManager.GetVersionObject("10.0", 1);
		var tmpAdminManager = tmpVersionObject.CreateObjectFromProgId("Microsoft.ApplicationHost.WritableAdminManager");
		return tmpAdminManager;
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to obtain the Admin Manager");
	}
}

// ================================================================================

function GetUserDirectory()
{
	try
	{
		var tmpVersionManager = WScript.CreateObject("Microsoft.IIS.VersionManager");
		var tmpVersionObject = tmpVersionManager.GetVersionObject("10.0", 1);
		var tmpUserData = tmpVersionObject.GetPropertyValue("userInstanceHelper")
		var tmpUserDirectory = tmpUserData.IISDirectory;
		if (tmpUserDirectory.length > 0) return tmpUserDirectory;
		throw("The User Directory cannot be determined.");
	}
	catch(e)
	{
		ErrorMessage(e,"The following error occurred trying to obtain the User Directory");
	}
}

// ================================================================================

function FindSectionGroup(tmpParentSectionGroup,tmpName)
{
	try
	{
		// Retrieve the index within the sectionGroup.
		var tmpElementPosition = FindElement2(tmpParentSectionGroup,tmpName);
		// Fail completely if we can't retrive the index.
		if (tmpElementPosition == -1) throw("Cannot retrieve index for '" & tmpName & "'.");
		return tmpParentSectionGroup.Item(tmpElementPosition);
	}
	catch(e)
	{
		ErrorMessage(e,"An error occurred trying to add a section group");
	}
}

// ================================================================================

function FindElement1(tmpCollection, tmpElementTagName, tmpValuesArray)
{
   for (var tmpCount1 = 0; tmpCount1 < tmpCollection.Count; ++tmpCount1)
   {
      var tmpElement = tmpCollection.Item(tmpCount1);
      if (tmpElement.Name == tmpElementTagName)
      {
         var tmpMatches = true;
         for (var tmpCount2 = 0; tmpCount2 < tmpValuesArray.length; tmpCount2 += 2)
         {
            var tmpProperty = tmpElement.GetPropertyByName(tmpValuesArray[tmpCount2]);
            var tmpValue = tmpProperty.Value;
            if (tmpValue != null) tmpValue = tmpValue.toString();
            if (tmpValue != tmpValuesArray[tmpCount2 + 1])
            {
               tmpMatches = false;
               break;
            }
         }
         if (tmpMatches) return tmpCount1;
      }
   }
   return -1;
}

// ================================================================================

function FindElement2(tmpCollection,tmpName)
{
	for (var tmpCount = 0; tmpCount < tmpCollection.Count; ++tmpCount)
	{
		var tmpElement = tmpCollection.Item(tmpCount);
		if (tmpElement.Name == tmpName)
		{
			return tmpCount;
		}
	}
   return -1;
}

// ================================================================================

function FindElement3(tmpCollection,tmpName)
{
	if ((tmpName.length ==0) || (tmpName.toLowerCase() == strLastItem.toLowerCase())) return -1;
	if ((tmpName.length ==0) || (tmpName.toLowerCase() == strFirstItem.toLowerCase())) return 0;	
	return FindElement1(tmpCollection,"add",["name",tmpName]);
}

// SIG // Begin signature block
// SIG // MIIapQYJKoZIhvcNAQcCoIIaljCCGpICAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFJC0/xuhb8l1
// SIG // /xeUfXYcZF/+spGEoIIViDCCBNowggPCoAMCAQICEzMA
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
// SIG // DjAMBgorBgEEAYI3AgEVMCMGCSqGSIb3DQEJBDEWBBTl
// SIG // NIw17tmhVXVaWUfscHjrkjWj2zBCBgorBgEEAYI3AgEM
// SIG // MTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAYaHR0
// SIG // cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3DQEB
// SIG // AQUABIIBACYNfHyBgHnd7/H6v+r7d/YgHEyppsW7T5kh
// SIG // F4XW6DUmTwQIIXz/0DVemgIm1sciyBDOIwq2pRkd9R9a
// SIG // wVgoR3zN/rSh+X/NCJ9JIRehK6StyAkepdsdZY68ufwO
// SIG // UrzYELDKuWMaw1zfxkGP7GILJRbK/kiZTWwQ/6cJABL9
// SIG // 9v3RJg1ruLP4zQpv+61nXx41r+Li6dTUnSMcPwnZGdM9
// SIG // RMUlSK+GDijRGjxikDWTqH2oBQHlYyo4mavdOH3jFyIL
// SIG // buZZvQLxkCgVtRVd7mUekh7tHS1V9Y5wYW73O1OxyLsE
// SIG // H5Eej6cf4v+O+dpkBFvu2wkGivDcCWWSCR5hW6a77/6h
// SIG // ggIoMIICJAYJKoZIhvcNAQkGMYICFTCCAhECAQEwgY4w
// SIG // dzELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEhMB8GA1UEAxMYTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBAhMzAAABIU6yA00/
// SIG // JGk2AAAAAAEhMAkGBSsOAwIaBQCgXTAYBgkqhkiG9w0B
// SIG // CQMxCwYJKoZIhvcNAQcBMBwGCSqGSIb3DQEJBTEPFw0x
// SIG // OTA2MDMxNzMwMTNaMCMGCSqGSIb3DQEJBDEWBBQkPQvk
// SIG // 5UTlq2imjhOACAXxEZuYIjANBgkqhkiG9w0BAQUFAASC
// SIG // AQAj52b5bW1zNQfBLP6dnfi1M8gWiqwD70YKLpmjTjy4
// SIG // i/rZE8AI/Z972fmnSwV5rJ6XVx0nJWW52DGj/hrIu1LB
// SIG // AFREe3Y+dsJF8MpV8hfS0MmXY4ULXUYYKswCaRY0MUTg
// SIG // T1RKUmnbhPFY89Xmn2cxi3j5eNLTbU9vpV4iTuDKuyNH
// SIG // zpIe11uSXBDpIy+HYvbrCYRNaEO23078tGlsMSZR7FZb
// SIG // sYnsjVmpMSjoKu6J/kxKMKWj3sTmxEARByEYCUjpGaDR
// SIG // bsZQ4s2vmiBChqQH+/nbj8GhKwZMsMLMp7xsB6GhQegd
// SIG // o3QS34RnbvNdL34e8451MsOhW7duF86vly/j
// SIG // End signature block
