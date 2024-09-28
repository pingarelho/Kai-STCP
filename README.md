# Kai STCP
Kai OS 2.5 app that displays STCP (Sociedade de Transportes Coletivos do Porto) real-time schedules.

### Firefox 48 limitations

This application's javascript code does not use certain modern features, such as the Fetch API instead of XMLHttpRequest, and is not as clean and organised as it could be because Kai OS 2.5 ships with Gecko 48, which does not have full support for ES6, meaning that support for ES modules, for example, is missing.

### DigiCert root certificate missing

The STCP website uses a DigiCert certificate, and Kai OS 2.5 will flag it as insecure. I found that injecting an up-to-date subordinate certificate ([Thawte TLS RSA CA G1](https://www.digicert.com/kb/digicert-root-certificates.htm)) using [this script](https://github.com/openGiraffes/b2g-certificates), which requires your device to have adb and root permissions, fixed this issue. You can read more about how to jailbreak and root your Kai OS device [here](https://wiki.bananahackers.net/).
