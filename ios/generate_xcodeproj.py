#!/usr/bin/env python3
"""Generate the Xcode project.pbxproj file for HealStudio."""

import hashlib
import os

def make_id(name):
    """Generate a deterministic 24-char hex ID from a name."""
    return hashlib.md5(name.encode()).hexdigest()[:24].upper()

# All Swift source files relative to HealStudio/
swift_files = [
    ("App", "HealStudioApp.swift"),
    ("App", "ContentView.swift"),
    ("Models", "Instructor.swift"),
    ("Models", "Session.swift"),
    ("Models", "Client.swift"),
    ("Models", "Settlement.swift"),
    ("Services", "APIClient.swift"),
    ("Services", "AuthService.swift"),
    ("Services", "SessionsAPI.swift"),
    ("Services", "ClientsAPI.swift"),
    ("Services", "InstructorsAPI.swift"),
    ("Services", "SettlementsAPI.swift"),
    ("ViewModels", "AuthViewModel.swift"),
    ("ViewModels", "CalendarViewModel.swift"),
    ("ViewModels", "SessionFormViewModel.swift"),
    ("ViewModels", "ClientListViewModel.swift"),
    ("ViewModels", "ClientFormViewModel.swift"),
    ("ViewModels", "SettlementViewModel.swift"),
    ("ViewModels", "InstructorSettingsViewModel.swift"),
    ("Views/Auth", "LoginView.swift"),
    ("Views/Auth", "UnauthorizedView.swift"),
    ("Views/Calendar", "CalendarView.swift"),
    ("Views/Calendar", "SessionCardView.swift"),
    ("Views/Calendar", "WeekHeaderView.swift"),
    ("Views/Calendar", "SessionModalView.swift"),
    ("Views/Calendar", "ClientPickerView.swift"),
    ("Views/Calendar", "RecurringEditSheet.swift"),
    ("Views/Clients", "ClientListView.swift"),
    ("Views/Clients", "ClientRowView.swift"),
    ("Views/Clients", "ClientFormSheet.swift"),
    ("Views/Settlements", "SettlementView.swift"),
    ("Views/Settlements", "SettlementInstructorCard.swift"),
    ("Views/Instructors", "InstructorSettingsView.swift"),
    ("Views/Instructors", "InstructorPricingRow.swift"),
    ("Views/Shared", "NavigationTabBar.swift"),
    ("Views/Shared", "LoadingSpinner.swift"),
    ("Views/Shared", "HealColors.swift"),
]

# IDs
PROJECT_ID = make_id("project")
MAIN_GROUP_ID = make_id("mainGroup")
PRODUCTS_GROUP_ID = make_id("productsGroup")
APP_GROUP_ID = make_id("HealStudio_group")
MODELS_GROUP_ID = make_id("Models_group")
SERVICES_GROUP_ID = make_id("Services_group")
VIEWMODELS_GROUP_ID = make_id("ViewModels_group")
VIEWS_GROUP_ID = make_id("Views_group")
VIEWS_AUTH_GROUP_ID = make_id("Views/Auth_group")
VIEWS_CALENDAR_GROUP_ID = make_id("Views/Calendar_group")
VIEWS_CLIENTS_GROUP_ID = make_id("Views/Clients_group")
VIEWS_SETTLEMENTS_GROUP_ID = make_id("Views/Settlements_group")
VIEWS_INSTRUCTORS_GROUP_ID = make_id("Views/Instructors_group")
VIEWS_SHARED_GROUP_ID = make_id("Views/Shared_group")
RESOURCES_GROUP_ID = make_id("Resources_group")
TARGET_ID = make_id("target")
SOURCES_PHASE_ID = make_id("sourcesBuildPhase")
RESOURCES_PHASE_ID = make_id("resourcesBuildPhase")
FRAMEWORKS_PHASE_ID = make_id("frameworksBuildPhase")
DEBUG_CONFIG_ID = make_id("debugConfig")
RELEASE_CONFIG_ID = make_id("releaseConfig")
TARGET_DEBUG_CONFIG_ID = make_id("targetDebugConfig")
TARGET_RELEASE_CONFIG_ID = make_id("targetReleaseConfig")
PROJECT_CONFIG_LIST_ID = make_id("projectConfigList")
TARGET_CONFIG_LIST_ID = make_id("targetConfigList")
PRODUCT_REF_ID = make_id("productRef")
ASSETS_FILE_ID = make_id("Assets.xcassets_file")
ASSETS_BUILD_ID = make_id("Assets.xcassets_build")
INFO_PLIST_ID = make_id("Info.plist_file")
GSIGNIN_PKG_ID = make_id("GoogleSignIn_pkg")
GSIGNIN_DEP_ID = make_id("GoogleSignIn_dep")
GSIGNINSWIFT_DEP_ID = make_id("GoogleSignInSwift_dep")
GSIGNIN_FWREF_ID = make_id("GoogleSignIn_fwref")
GSIGNINSWIFT_FWREF_ID = make_id("GoogleSignInSwift_fwref")
DEPENDENCY_ID = make_id("targetDependency")

# Build file refs and source refs for each swift file
file_refs = {}
build_refs = {}
for group, fname in swift_files:
    path = f"{group}/{fname}"
    file_refs[path] = make_id(f"fileRef_{path}")
    build_refs[path] = make_id(f"buildRef_{path}")

# Group children mapping
group_children = {
    "App": [],
    "Models": [],
    "Services": [],
    "ViewModels": [],
    "Views/Auth": [],
    "Views/Calendar": [],
    "Views/Clients": [],
    "Views/Settlements": [],
    "Views/Instructors": [],
    "Views/Shared": [],
}

for group, fname in swift_files:
    path = f"{group}/{fname}"
    group_children[group].append(file_refs[path])

group_ids = {
    "App": APP_GROUP_ID,
    "Models": MODELS_GROUP_ID,
    "Services": SERVICES_GROUP_ID,
    "ViewModels": VIEWMODELS_GROUP_ID,
    "Views/Auth": VIEWS_AUTH_GROUP_ID,
    "Views/Calendar": VIEWS_CALENDAR_GROUP_ID,
    "Views/Clients": VIEWS_CLIENTS_GROUP_ID,
    "Views/Settlements": VIEWS_SETTLEMENTS_GROUP_ID,
    "Views/Instructors": VIEWS_INSTRUCTORS_GROUP_ID,
    "Views/Shared": VIEWS_SHARED_GROUP_ID,
}

lines = []
lines.append('// !$*UTF8*$!')
lines.append('{')
lines.append('\tarchiveVersion = 1;')
lines.append('\tclasses = {')
lines.append('\t};')
lines.append('\tobjectVersion = 56;')
lines.append('\tobjects = {')
lines.append('')

# PBXBuildFile section
lines.append('/* Begin PBXBuildFile section */')
for group, fname in swift_files:
    path = f"{group}/{fname}"
    lines.append(f'\t\t{build_refs[path]} /* {fname} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_refs[path]} /* {fname} */; }};')
lines.append(f'\t\t{ASSETS_BUILD_ID} /* Assets.xcassets in Resources */ = {{isa = PBXBuildFile; fileRef = {ASSETS_FILE_ID} /* Assets.xcassets */; }};')
lines.append(f'\t\t{GSIGNIN_FWREF_ID} /* GoogleSignIn in Frameworks */ = {{isa = PBXBuildFile; productRef = {GSIGNIN_DEP_ID} /* GoogleSignIn */; }};')
lines.append(f'\t\t{GSIGNINSWIFT_FWREF_ID} /* GoogleSignInSwift in Frameworks */ = {{isa = PBXBuildFile; productRef = {GSIGNINSWIFT_DEP_ID} /* GoogleSignInSwift */; }};')
lines.append('/* End PBXBuildFile section */')
lines.append('')

# PBXFileReference section
lines.append('/* Begin PBXFileReference section */')
for group, fname in swift_files:
    path = f"{group}/{fname}"
    lines.append(f'\t\t{file_refs[path]} /* {fname} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {fname}; sourceTree = "<group>"; }};')
lines.append(f'\t\t{ASSETS_FILE_ID} /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; }};')
lines.append(f'\t\t{INFO_PLIST_ID} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; }};')
lines.append(f'\t\t{PRODUCT_REF_ID} /* HealStudio.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = HealStudio.app; sourceTree = BUILT_PRODUCTS_DIR; }};')
lines.append('/* End PBXFileReference section */')
lines.append('')

# PBXFrameworksBuildPhase
lines.append('/* Begin PBXFrameworksBuildPhase section */')
lines.append(f'\t\t{FRAMEWORKS_PHASE_ID} /* Frameworks */ = {{')
lines.append('\t\t\tisa = PBXFrameworksBuildPhase;')
lines.append('\t\t\tbuildActionMask = 2147483647;')
lines.append('\t\t\tfiles = (')
lines.append(f'\t\t\t\t{GSIGNIN_FWREF_ID} /* GoogleSignIn in Frameworks */,')
lines.append(f'\t\t\t\t{GSIGNINSWIFT_FWREF_ID} /* GoogleSignInSwift in Frameworks */,')
lines.append('\t\t\t);')
lines.append('\t\t\trunOnlyForDeploymentPostprocessing = 0;')
lines.append('\t\t};')
lines.append('/* End PBXFrameworksBuildPhase section */')
lines.append('')

# PBXGroup section
lines.append('/* Begin PBXGroup section */')

# Main group
lines.append(f'\t\t{MAIN_GROUP_ID} = {{')
lines.append('\t\t\tisa = PBXGroup;')
lines.append('\t\t\tchildren = (')
lines.append(f'\t\t\t\t{APP_GROUP_ID} /* App */,')
lines.append(f'\t\t\t\t{MODELS_GROUP_ID} /* Models */,')
lines.append(f'\t\t\t\t{SERVICES_GROUP_ID} /* Services */,')
lines.append(f'\t\t\t\t{VIEWMODELS_GROUP_ID} /* ViewModels */,')
lines.append(f'\t\t\t\t{VIEWS_GROUP_ID} /* Views */,')
lines.append(f'\t\t\t\t{RESOURCES_GROUP_ID} /* Resources */,')
lines.append(f'\t\t\t\t{PRODUCTS_GROUP_ID} /* Products */,')
lines.append('\t\t\t);')
lines.append('\t\t\tpath = HealStudio;')
lines.append('\t\t\tsourceTree = "<group>";')
lines.append('\t\t};')

# Products group
lines.append(f'\t\t{PRODUCTS_GROUP_ID} /* Products */ = {{')
lines.append('\t\t\tisa = PBXGroup;')
lines.append('\t\t\tchildren = (')
lines.append(f'\t\t\t\t{PRODUCT_REF_ID} /* HealStudio.app */,')
lines.append('\t\t\t);')
lines.append('\t\t\tname = Products;')
lines.append('\t\t\tsourceTree = "<group>";')
lines.append('\t\t};')

# Resources group
lines.append(f'\t\t{RESOURCES_GROUP_ID} /* Resources */ = {{')
lines.append('\t\t\tisa = PBXGroup;')
lines.append('\t\t\tchildren = (')
lines.append(f'\t\t\t\t{ASSETS_FILE_ID} /* Assets.xcassets */,')
lines.append(f'\t\t\t\t{INFO_PLIST_ID} /* Info.plist */,')
lines.append('\t\t\t);')
lines.append('\t\t\tpath = Resources;')
lines.append('\t\t\tsourceTree = "<group>";')
lines.append('\t\t};')

# Source groups (flat: App, Models, Services, ViewModels)
for gname in ["App", "Models", "Services", "ViewModels"]:
    gid = group_ids[gname]
    children = group_children[gname]
    lines.append(f'\t\t{gid} /* {gname} */ = {{')
    lines.append('\t\t\tisa = PBXGroup;')
    lines.append('\t\t\tchildren = (')
    for cid in children:
        # find filename
        for g, f in swift_files:
            p = f"{g}/{f}"
            if file_refs[p] == cid:
                lines.append(f'\t\t\t\t{cid} /* {f} */,')
                break
    lines.append('\t\t\t);')
    lines.append(f'\t\t\tpath = {gname};')
    lines.append('\t\t\tsourceTree = "<group>";')
    lines.append('\t\t};')

# Views group (parent with sub-groups)
lines.append(f'\t\t{VIEWS_GROUP_ID} /* Views */ = {{')
lines.append('\t\t\tisa = PBXGroup;')
lines.append('\t\t\tchildren = (')
lines.append(f'\t\t\t\t{VIEWS_AUTH_GROUP_ID} /* Auth */,')
lines.append(f'\t\t\t\t{VIEWS_CALENDAR_GROUP_ID} /* Calendar */,')
lines.append(f'\t\t\t\t{VIEWS_CLIENTS_GROUP_ID} /* Clients */,')
lines.append(f'\t\t\t\t{VIEWS_SETTLEMENTS_GROUP_ID} /* Settlements */,')
lines.append(f'\t\t\t\t{VIEWS_INSTRUCTORS_GROUP_ID} /* Instructors */,')
lines.append(f'\t\t\t\t{VIEWS_SHARED_GROUP_ID} /* Shared */,')
lines.append('\t\t\t);')
lines.append('\t\t\tpath = Views;')
lines.append('\t\t\tsourceTree = "<group>";')
lines.append('\t\t};')

# Views sub-groups
for subgroup in ["Auth", "Calendar", "Clients", "Settlements", "Instructors", "Shared"]:
    full_key = f"Views/{subgroup}"
    gid = group_ids[full_key]
    children = group_children[full_key]
    lines.append(f'\t\t{gid} /* {subgroup} */ = {{')
    lines.append('\t\t\tisa = PBXGroup;')
    lines.append('\t\t\tchildren = (')
    for cid in children:
        for g, f in swift_files:
            p = f"{g}/{f}"
            if file_refs[p] == cid:
                lines.append(f'\t\t\t\t{cid} /* {f} */,')
                break
    lines.append('\t\t\t);')
    lines.append(f'\t\t\tpath = {subgroup};')
    lines.append('\t\t\tsourceTree = "<group>";')
    lines.append('\t\t};')

lines.append('/* End PBXGroup section */')
lines.append('')

# PBXNativeTarget
lines.append('/* Begin PBXNativeTarget section */')
lines.append(f'\t\t{TARGET_ID} /* HealStudio */ = {{')
lines.append('\t\t\tisa = PBXNativeTarget;')
lines.append(f'\t\t\tbuildConfigurationList = {TARGET_CONFIG_LIST_ID} /* Build configuration list for PBXNativeTarget "HealStudio" */;')
lines.append('\t\t\tbuildPhases = (')
lines.append(f'\t\t\t\t{SOURCES_PHASE_ID} /* Sources */,')
lines.append(f'\t\t\t\t{FRAMEWORKS_PHASE_ID} /* Frameworks */,')
lines.append(f'\t\t\t\t{RESOURCES_PHASE_ID} /* Resources */,')
lines.append('\t\t\t);')
lines.append('\t\t\tbuildRules = (')
lines.append('\t\t\t);')
lines.append('\t\t\tdependencies = (')
lines.append('\t\t\t);')
lines.append('\t\t\tname = HealStudio;')
lines.append('\t\t\tpackageProductDependencies = (')
lines.append(f'\t\t\t\t{GSIGNIN_DEP_ID} /* GoogleSignIn */,')
lines.append(f'\t\t\t\t{GSIGNINSWIFT_DEP_ID} /* GoogleSignInSwift */,')
lines.append('\t\t\t);')
lines.append(f'\t\t\tproductName = HealStudio;')
lines.append(f'\t\t\tproductReference = {PRODUCT_REF_ID} /* HealStudio.app */;')
lines.append('\t\t\tproductType = "com.apple.product-type.application";')
lines.append('\t\t};')
lines.append('/* End PBXNativeTarget section */')
lines.append('')

# PBXProject
lines.append('/* Begin PBXProject section */')
lines.append(f'\t\t{PROJECT_ID} /* Project object */ = {{')
lines.append('\t\t\tisa = PBXProject;')
lines.append(f'\t\t\tbuildConfigurationList = {PROJECT_CONFIG_LIST_ID} /* Build configuration list for PBXProject "HealStudio" */;')
lines.append('\t\t\tcompatibilityVersion = "Xcode 14.0";')
lines.append('\t\t\tdevelopmentRegion = pl;')
lines.append('\t\t\thasScannedForEncodings = 0;')
lines.append('\t\t\tknownRegions = (')
lines.append('\t\t\t\tpl,')
lines.append('\t\t\t\tBase,')
lines.append('\t\t\t);')
lines.append(f'\t\t\tmainGroup = {MAIN_GROUP_ID};')
lines.append('\t\t\tpackageReferences = (')
lines.append(f'\t\t\t\t{GSIGNIN_PKG_ID} /* XCRemoteSwiftPackageReference "GoogleSignIn-iOS" */,')
lines.append('\t\t\t);')
lines.append(f'\t\t\tproductRefGroup = {PRODUCTS_GROUP_ID} /* Products */;')
lines.append('\t\t\tprojectDirPath = "";')
lines.append('\t\t\tprojectRoot = "";')
lines.append('\t\t\ttargets = (')
lines.append(f'\t\t\t\t{TARGET_ID} /* HealStudio */,')
lines.append('\t\t\t);')
lines.append('\t\t};')
lines.append('/* End PBXProject section */')
lines.append('')

# PBXResourcesBuildPhase
lines.append('/* Begin PBXResourcesBuildPhase section */')
lines.append(f'\t\t{RESOURCES_PHASE_ID} /* Resources */ = {{')
lines.append('\t\t\tisa = PBXResourcesBuildPhase;')
lines.append('\t\t\tbuildActionMask = 2147483647;')
lines.append('\t\t\tfiles = (')
lines.append(f'\t\t\t\t{ASSETS_BUILD_ID} /* Assets.xcassets in Resources */,')
lines.append('\t\t\t);')
lines.append('\t\t\trunOnlyForDeploymentPostprocessing = 0;')
lines.append('\t\t};')
lines.append('/* End PBXResourcesBuildPhase section */')
lines.append('')

# PBXSourcesBuildPhase
lines.append('/* Begin PBXSourcesBuildPhase section */')
lines.append(f'\t\t{SOURCES_PHASE_ID} /* Sources */ = {{')
lines.append('\t\t\tisa = PBXSourcesBuildPhase;')
lines.append('\t\t\tbuildActionMask = 2147483647;')
lines.append('\t\t\tfiles = (')
for group, fname in swift_files:
    path = f"{group}/{fname}"
    lines.append(f'\t\t\t\t{build_refs[path]} /* {fname} in Sources */,')
lines.append('\t\t\t);')
lines.append('\t\t\trunOnlyForDeploymentPostprocessing = 0;')
lines.append('\t\t};')
lines.append('/* End PBXSourcesBuildPhase section */')
lines.append('')

# XCBuildConfiguration - Project level
lines.append('/* Begin XCBuildConfiguration section */')
for config_id, config_name in [(DEBUG_CONFIG_ID, "Debug"), (RELEASE_CONFIG_ID, "Release")]:
    is_debug = config_name == "Debug"
    lines.append(f'\t\t{config_id} /* {config_name} */ = {{')
    lines.append('\t\t\tisa = XCBuildConfiguration;')
    lines.append('\t\t\tbuildSettings = {')
    lines.append('\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;')
    lines.append('\t\t\t\tASSTETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS = YES;')
    lines.append('\t\t\t\tCLANG_ANALYZER_NONNULL = YES;')
    lines.append('\t\t\t\tCLANG_CXX_LANGUAGE_STANDARD = "gnu++20";')
    lines.append('\t\t\t\tCLANG_ENABLE_MODULES = YES;')
    lines.append('\t\t\t\tCLANG_ENABLE_OBJC_ARC = YES;')
    lines.append('\t\t\t\tCOPY_PHASE_STRIP = NO;')
    if is_debug:
        lines.append('\t\t\t\tDEBUG_INFORMATION_FORMAT = dwarf;')
        lines.append('\t\t\t\tENABLE_STRICT_OBJC_MSGSEND = YES;')
        lines.append('\t\t\t\tENABLE_TESTABILITY = YES;')
        lines.append('\t\t\t\tGCC_DYNAMIC_NO_PIC = NO;')
        lines.append('\t\t\t\tGCC_OPTIMIZATION_LEVEL = 0;')
        lines.append('\t\t\t\tGCC_PREPROCESSOR_DEFINITIONS = (')
        lines.append('\t\t\t\t\t"DEBUG=1",')
        lines.append('\t\t\t\t\t"$(inherited)",')
        lines.append('\t\t\t\t);')
        lines.append('\t\t\t\tONLY_ACTIVE_ARCH = YES;')
    else:
        lines.append('\t\t\t\tDEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";')
        lines.append('\t\t\t\tENABLE_NS_ASSERTIONS = NO;')
        lines.append('\t\t\t\tENABLE_STRICT_OBJC_MSGSEND = YES;')
        lines.append('\t\t\t\tGCC_OPTIMIZATION_LEVEL = s;')
    lines.append('\t\t\t\tGCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;')
    lines.append('\t\t\t\tGCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;')
    lines.append('\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 17.0;')
    lines.append('\t\t\t\tLOCALIZATION_PREFERS_STRING_CATALOGS = YES;')
    lines.append('\t\t\t\tMTL_ENABLE_DEBUG_INFO = ' + ('INCLUDE_SOURCE' if is_debug else 'NO') + ';')
    lines.append('\t\t\t\tSDKROOT = iphoneos;')
    lines.append('\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = ' + ('"$(inherited) DEBUG"' if is_debug else '"$(inherited)"') + ';')
    lines.append('\t\t\t\tSWIFT_COMPILATION_MODE = ' + ('singlefile' if is_debug else 'wholemodule') + ';')
    lines.append('\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = ' + ('"-Onone"' if is_debug else '"-O"') + ';')
    if not is_debug:
        lines.append('\t\t\t\tVALIDATE_PRODUCT = YES;')
    lines.append('\t\t\t};')
    lines.append(f'\t\t\tname = {config_name};')
    lines.append('\t\t};')

# Target-level build configurations
for config_id, config_name in [(TARGET_DEBUG_CONFIG_ID, "Debug"), (TARGET_RELEASE_CONFIG_ID, "Release")]:
    lines.append(f'\t\t{config_id} /* {config_name} */ = {{')
    lines.append('\t\t\tisa = XCBuildConfiguration;')
    lines.append('\t\t\tbuildSettings = {')
    lines.append('\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;')
    lines.append('\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;')
    lines.append('\t\t\t\tCODE_SIGN_STYLE = Automatic;')
    lines.append('\t\t\t\tCURRENT_PROJECT_VERSION = 1;')
    lines.append('\t\t\t\tGENERATE_INFOPLIST_FILE = YES;')
    lines.append('\t\t\t\tINFOPLIST_FILE = HealStudio/Resources/Info.plist;')
    lines.append('\t\t\t\tINFOPLIST_KEY_CFBundleDisplayName = "HEAL Studio";')
    lines.append('\t\t\t\tINFOPLIST_KEY_UIApplicationSceneManifest_Generation = YES;')
    lines.append('\t\t\t\tINFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;')
    lines.append('\t\t\t\tINFOPLIST_KEY_UILaunchScreen_Generation = YES;')
    lines.append('\t\t\t\tINFOPLIST_KEY_UISupportedInterfaceOrientations = UIInterfaceOrientationPortrait;')
    lines.append('\t\t\t\tINFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown";')
    lines.append('\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (')
    lines.append('\t\t\t\t\t"$(inherited)",')
    lines.append('\t\t\t\t\t"@executable_path/Frameworks",')
    lines.append('\t\t\t\t);')
    lines.append('\t\t\t\tMARKETING_VERSION = 1.0;')
    lines.append('\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.healpilates.HealStudio;')
    lines.append('\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";')
    lines.append('\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;')
    lines.append('\t\t\t\tSWIFT_VERSION = 5.0;')
    lines.append('\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";')
    lines.append('\t\t\t};')
    lines.append(f'\t\t\tname = {config_name};')
    lines.append('\t\t};')

lines.append('/* End XCBuildConfiguration section */')
lines.append('')

# XCConfigurationList
lines.append('/* Begin XCConfigurationList section */')
lines.append(f'\t\t{PROJECT_CONFIG_LIST_ID} /* Build configuration list for PBXProject "HealStudio" */ = {{')
lines.append('\t\t\tisa = XCConfigurationList;')
lines.append('\t\t\tbuildConfigurations = (')
lines.append(f'\t\t\t\t{DEBUG_CONFIG_ID} /* Debug */,')
lines.append(f'\t\t\t\t{RELEASE_CONFIG_ID} /* Release */,')
lines.append('\t\t\t);')
lines.append('\t\t\tdefaultConfigurationIsVisible = 0;')
lines.append('\t\t\tdefaultConfigurationName = Release;')
lines.append('\t\t};')
lines.append(f'\t\t{TARGET_CONFIG_LIST_ID} /* Build configuration list for PBXNativeTarget "HealStudio" */ = {{')
lines.append('\t\t\tisa = XCConfigurationList;')
lines.append('\t\t\tbuildConfigurations = (')
lines.append(f'\t\t\t\t{TARGET_DEBUG_CONFIG_ID} /* Debug */,')
lines.append(f'\t\t\t\t{TARGET_RELEASE_CONFIG_ID} /* Release */,')
lines.append('\t\t\t);')
lines.append('\t\t\tdefaultConfigurationIsVisible = 0;')
lines.append('\t\t\tdefaultConfigurationName = Release;')
lines.append('\t\t};')
lines.append('/* End XCConfigurationList section */')
lines.append('')

# XCRemoteSwiftPackageReference
lines.append('/* Begin XCRemoteSwiftPackageReference section */')
lines.append(f'\t\t{GSIGNIN_PKG_ID} /* XCRemoteSwiftPackageReference "GoogleSignIn-iOS" */ = {{')
lines.append('\t\t\tisa = XCRemoteSwiftPackageReference;')
lines.append('\t\t\trepositoryURL = "https://github.com/google/GoogleSignIn-iOS";')
lines.append('\t\t\trequirement = {')
lines.append('\t\t\t\tkind = upToNextMajorVersion;')
lines.append('\t\t\t\tminimumVersion = 7.0.0;')
lines.append('\t\t\t};')
lines.append('\t\t};')
lines.append('/* End XCRemoteSwiftPackageReference section */')
lines.append('')

# XCSwiftPackageProductDependency
lines.append('/* Begin XCSwiftPackageProductDependency section */')
lines.append(f'\t\t{GSIGNIN_DEP_ID} /* GoogleSignIn */ = {{')
lines.append('\t\t\tisa = XCSwiftPackageProductDependency;')
lines.append(f'\t\t\tpackage = {GSIGNIN_PKG_ID} /* XCRemoteSwiftPackageReference "GoogleSignIn-iOS" */;')
lines.append('\t\t\tproductName = GoogleSignIn;')
lines.append('\t\t};')
lines.append(f'\t\t{GSIGNINSWIFT_DEP_ID} /* GoogleSignInSwift */ = {{')
lines.append('\t\t\tisa = XCSwiftPackageProductDependency;')
lines.append(f'\t\t\tpackage = {GSIGNIN_PKG_ID} /* XCRemoteSwiftPackageReference "GoogleSignIn-iOS" */;')
lines.append('\t\t\tproductName = GoogleSignInSwift;')
lines.append('\t\t};')
lines.append('/* End XCSwiftPackageProductDependency section */')
lines.append('')

lines.append('\t};')
lines.append(f'\trootObject = {PROJECT_ID} /* Project object */;')
lines.append('}')

output = '\n'.join(lines) + '\n'

output_path = '/home/user/Apliakacja-Heal-Studio/ios/HealStudio/HealStudio.xcodeproj/project.pbxproj'
with open(output_path, 'w') as f:
    f.write(output)

print(f"Generated {output_path}")
print(f"Total lines: {len(lines)}")
print(f"Swift files referenced: {len(swift_files)}")
