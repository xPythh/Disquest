const fetch = require("node-fetch");


module.exports = class {

	#tokenHeader;

	async get(header, application)
	{
		this.#tokenHeader = header;
		for (var key of Object.keys(application)) 
			this[key] = await application[key];

	}

	async fetch(applicationId)
	{
		var request = await fetch(`https://discord.com/api/v9/applications/${applicationId}`, { headers: this.#tokenHeader });
		var requestJson = await request.json();
		for (var key of Object.keys(requestJson)) this[key] = await requestJson[key];

		return this;
	}

	async create(name = "My New Application")
	{
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		try {
			var request = await fetch(`https://discord.com/api/v9/applications`,
			{
				method: "POST",
				headers: tempTokenHeader,
				body: JSON.stringify({
					name: name,
					team_id: null
				})
			});
			var requestJson = await request.json();
			for (var key of Object.keys(requestJson)) this[key] = await requestJson[key];		
			return await requestJson;
		} catch (ex) {
			console.log(ex);
			return await this.create();
		}
	}

	async updateName(name)
	{
		if (!this.id)
			throw new Error(`Application hasnt been fetched. Please use .fetch("ApplicationID") beforehand.`);
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		try {
			var request = await fetch(`https://discord.com/api/v9/applications/${this.id}`,
			{
				method: "PATCH",
				headers: tempTokenHeader,
				body: JSON.stringify({ name: name })
			});
			var requestJson = await request.json();
			for (var key of Object.keys(requestJson)) this[key] = await requestJson[key];		
			return await requestJson;
		} catch (ex) {
			console.log(ex);
			return await this.create();
		}
	}

	async updateDescription(description)
	{
		if (!this.id)
			throw new Error(`Application hasnt been fetched. Please use .fetch("ApplicationID") beforehand.`);
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		try {
			var request = await fetch(`https://discord.com/api/v9/applications/${this.id}`,
			{
				method: "PATCH",
				headers: tempTokenHeader,
				body: JSON.stringify({ description: description })
			});
			var requestJson = await request.json();
			for (var key of Object.keys(requestJson)) this[key] = await requestJson[key];		
			return await requestJson;
		} catch (ex) {
			console.log(ex);
			return await this.create();
		}
	}

	async createBot()
	{
		if (!this.id)
			throw new Error(`Application hasnt been fetched. Please use .fetch("ApplicationID") beforehand.`);
		await fetch(`https://discord.com/api/v9/applications/${this.id}/bot`, { headers: this.#tokenHeader });
		return null;
	}

	async deauthorize()
	{
		try {
			await fetch(`https://discord.com/api/v9/oauth2/tokens/${this.id}`,
			{
				method: "DELETE",
				headers: this.#tokenHeader
			});
			return null;
		} catch (ex) {
			console.log(ex);
			return await this.deauthorize();
		}
	}

}