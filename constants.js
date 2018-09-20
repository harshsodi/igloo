exports.FILE_TYPES = [
    "ecc_agent_script_include",
    "sys_script_include",
    "sys_ui_action", 
    "sys_script", 
    "sys_script_client",
    "sysauto_script"
]

exports.TYPE_DIRECTORY_MAP = {
    "ecc_agent_script_include" : "MID Server Script Includes",
    "sys_script_include" : "Script Includes",
    "sys_ui_action" : "UI Actions",
    "sys_script" : "Business Rules",
    "sys_script_client" : "Client Scripts",
    "sysauto_script" : "Scheduled Script Executions"
}

exports.TYPE_SIMPLE_MAP = {
    "ecc_agent_script_include" : "mid_server_script",
    "sys_script_include" : "script_include",
    "sys_ui_action" : "ui_action",
    "sys_script" : "business_rule",
    "sys_script_client" : "client_script",
    "sysauto_script" : "scheduled_script"
}

exports.API_PATH = "api/now/"

exports.outdir = "ServiceNow"

exports.CONFIG_FILE_NAME = "register.json";