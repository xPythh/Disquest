var Client = require("./Client.js"); 

function Disquest(token)
{
	if (token === null) 
		throw new Error('Token not provided on Static initialisation.'); 

	return new Client(token);
}

module.exports = Disquest;