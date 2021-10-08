exports.FRONTEND_ORIGIN = "http://localhost:3000"                                  // <- hardcode for poc.

// FIXME: This shouldn't be necessary to handle here, but until https://github.com/enonic/xp/issues/8530 is fixed, it is.
exports.MAPPING_TO_THIS_PROXY = '_ext_frontend_proxy';

// Detects if this proxy is used as a non-content-item proxy (and instead points to frontend assets etc), and matches any following path to regex group 1.
exports.PROXY_MATCH_PATTERN = new RegExp(`^/?${exports.MAPPING_TO_THIS_PROXY}(/.*)?$`);

exports.FROM_XP_PARAM = '__fromXp__';

