var JSTACK = {
	Keystone: jasmine.createSpyObj("Keystone", ["init", "authenticate", "gettenants", "params"]),
	Nova: jasmine.createSpyObj("Nova", ["getflavorlist", "createflavor", "deleteflavor"])
};