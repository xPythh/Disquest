const fetch = require("node-fetch");
const fs = require("fs");

var User = require("./User.js"); /* someone else */
var Boost = require("./Boost.js");
var Application = require("./Application.js");

module.exports = new class 
{
	#tokenHeader;
	#accountPassword;

	async get(header)
	{
		this.#tokenHeader = header;

		try {
			var request = await fetch("https://discord.com/api/v9/users/@me", { headers: this.#tokenHeader });
			var requestJson = await request.json();
			for (var key of Object.keys(await requestJson)) this[key] = await requestJson[key];


			return this;
		} catch (ex) {
			console.log(ex)
			return await this.get(this.#tokenHeader);
		}		
	}

	async setPassword(accountPassword) { this.#accountPassword = accountPassword; }

	async getBillingSources()
	{
		try {
			var request = await fetch("https://discord.com/api/v9/users/@me/billing/payment-sources", {  headers: this.#tokenHeader  });
			return await request.json();
		} catch (ex) {
			console.log(ex)
			return await this.getBillingSources();
		}
	}

	async getSubscription()
	{
		var result = {}
		var subsType = [ "None", "Nitro Classic", "Nitro Boost"];
		try {
			var request = await fetch("https://discord.com/api/v9/users/@me/billing/subscriptions", { headers: this.#tokenHeader });
			var requestJson = await request.json();
			if (await requestJson.length === 0) return subsType[0];
			result.subscription =  subsType[await requestJson[0].type];

			
			var boosts = [];
			var request = await fetch("https://discord.com/api/v9/users/@me/guilds/premium/subscription-slots", {  headers: this.#tokenHeader });
			var requestJson = await request.json();
			if (await requestJson.message) return await requestJson;

			for (var boost of await requestJson)
			{
				var newBoost = new Boost();
				newBoost.get(this.#tokenHeader, await boost);
				boosts.push(await newBoost);
			}
			result.boosts = boosts
			return result;
		} catch (ex) {
			console.log(ex)
			return await this.getSubscription();
		}
	}

	async getRelationShips()
	{
		try {
			var friends = [];
			var request = await fetch(`https://discord.com/api/v9/users/@me/relationships`, { headers: this.#tokenHeader });
			var requestJson = await request.json();
			for (var friend of await requestJson)
			{
				var newUser = new User(); /* someone else */
				friends.push(await newUser.get(this.#tokenHeader, await friend));
			}
			return await friends;
		} catch (ex) {
			console.log(ex)
			return await this.getRelationShips();			
		}		
	}

	async getOpenDms()
	{
		try {
			var openDms = [];
			var request = await fetch("https://discord.com/api/v9/users/@me/channels", { headers: this.#tokenHeader });
			var requestJson = await request.json();
			/* TODO
			for (var dm of await requestJson)
			{
				var newUser = new User();
				friends.push(await newUser.get(this.#tokenHeader, await friend));
			}
			*/
			return await requestJson;
		} catch (ex) {
			console.log(ex)
			return await this.getOpenDms();
		}
	}

	async getServers()
	{
		try {
			var request = await fetch("https://discord.com/api/v9/users/@me/guilds", { headers: this.#tokenHeader });
			var requestJson = await request.json();
			return await requestJson;
		} catch (ex) {
			console.log(ex)
			return await this.getServers();
		}
	}

	async updateUsername(username = this.username, discriminator = this.discriminator)
	{
		if (!this.#accountPassword) 
			throw new Error('Error: updateUsername require the method .setPassword("ACCOUNT_PASSWORD"); in order to be used.'); 
		(typeof discriminator === "number") ? discriminator = discriminator.toString() : null;
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		var request = await fetch(`https://discord.com/api/v9/users/@me`,
		{
			method: "PATCH",
			headers: tempTokenHeader,
			body: JSON.stringify({
				username: username,
				discriminator: discriminator,
				password: this.#accountPassword	
			})
		});
		var requestJson = await request.json();
		for (var key of Object.keys(await requestJson)) this[key] = await requestJson[key];

		return await requestJson;
	}

	async sendUpdateEmailCode()
	{
		await fetch(` https://discord.com/api/v9/users/@me/email`,
		{
			method: "PUT",
			headers: this.#tokenHeader
		});
		return null;
	}

	async updateEmail(email = this.email, verificationCode = null)
	{
		if (!this.#accountPassword)
			throw new Error('Error: accountPassword require the method .setPassword("ACCOUNT_PASSWORD"); in order to be used.'); 
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		var request = await fetch(`https://discord.com/api/v9/users/@me/email/verify-code`,
		{
			method: "POST",
			headers: tempTokenHeader,
			body: JSON.stringify({ code: verificationCode })
		});
		var requestJson = await request.json();
		if (await requestJson.message) return await requestJson;
		var emailVerificationToken = await requestJson.token;
		var request = await fetch(`https://discord.com/api/v9/users/@me`,
		{
			method: "PATCH",
			headers: tempTokenHeader,
			body: JSON.stringify({
				email: email,
				email_token: await emailVerificationToken,
				password: this.#accountPassword	
			})
		});
		var requestJson = await request.json();
		for (var key of Object.keys(await requestJson)) this[key] = await requestJson[key];
		return await requestJson;
	}

	async updatePassword(newPassword, authentificatorCode)
	{
		if (!this.#accountPassword)
			throw new Error('Error: updatePassword require the method .setPassword("ACCOUNT_PASSWORD"); in order to be used.');
		if (!newPassword)
			throw new Error('Error: Please insert a new password.');
		
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		var request = await fetch(`https://discord.com/api/v9/users/@me`,
		{
			method: "PATCH",
			headers: tempTokenHeader,
			body: JSON.stringify({
				code: authentificatorCode.toString(),
				password: this.#accountPassword,
				new_password: newPassword
			})
		});
		var requestJson = await request.json();
		if (await requestJson.message)
		{
			if (await requestJson.message === "Invalid two-factor code")
				throw new Error('Error: Account used has 2FA enabled. Please enter the 2FA code as a second argument.'); 
			return await requestJson;
		} 
		this.#tokenHeader["authorization"] = await requestJson.token;
		return await requestJson;
	}

	async updateAvatar(avatarPath)
	{
		if (!avatarPath)
			throw new Error('Please specify an avatar file path.');
		if (!fs.existsSync(avatarPath))
			throw new Error('Invalid file path.');

		var fileContent = fs.readFileSync(avatarPath, 'base64');
		var fileType = avatarPath.split(".")[avatarPath.split(".").length-1];
		var finalData = `data:${ (fileType === "gif") ? "application/octet-stream" : "image/png"};base64,${fileContent}`;
		
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		var request = await fetch(`https://discord.com/api/v9/users/@me`,
		{
			method: "PATCH",
			headers: tempTokenHeader,
			body: JSON.stringify({ avatar: finalData })
		});
		var requestJson = await request.json();
		for (var key of Object.keys(await requestJson)) this[key] = await requestJson[key];
		return await requestJson;		
	}

	async updateBannerColor(color = "FFFFFF")
	{
		color = color.split("#").join("");

		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		var request = await fetch(`https://discord.com/api/v9/users/@me/profile`,
		{
			method: "PATCH",
			headers: tempTokenHeader,
			body: JSON.stringify({ accent_color: parseInt(color, 16)})
		});
		var requestJson = await request.json();
		for (var key of Object.keys(await requestJson)) this[key] = await requestJson[key];
		return await requestJson;		
	}

	async updateBannerPicture(bannerPath)
	{
		if (!bannerPath)
			throw new Error('Please specify an banner file path.');
		if (!fs.existsSync(bannerPath))
			throw new Error('Invalid file path.');

		var fileContent = fs.readFileSync(bannerPath, 'base64');
		var fileType = bannerPath.split(".")[bannerPath.split(".").length-1];
		var finalData = `data:${ (fileType === "gif") ? "application/octet-stream" : "image/png"};base64,${fileContent}`;
		
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		var request = await fetch(`https://discord.com/api/v9/users/@me/profile`,
		{
			method: "PATCH",
			headers: tempTokenHeader,
			body: JSON.stringify({ banner: finalData })
		});
		var requestJson = await request.json();
		for (var key of Object.keys(await requestJson)) this[key] = await requestJson[key];
		return await requestJson;		
	}

	async updateBio(aboutMe = "")
	{
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		var request = await fetch(`https://discord.com/api/v9/users/@me/profile`,
		{
			method: "PATCH",
			headers: tempTokenHeader,
			body: JSON.stringify({ bio: aboutMe })
		});
		var requestJson = await request.json();
		for (var key of Object.keys(await requestJson)) this[key] = await requestJson[key];
		return await requestJson;		
	}

	async enableDirectDms(enabled = true)
	{
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		var status = (enabled) ? "QggKABIAWgIIAg==" : "QgoKABIAIAFaAggC";
		await fetch(`https://discord.com/api/v9/users/@me/settings-proto/1`,
		{
			method: "PATCH",
			headers: tempTokenHeader,
			body: JSON.stringify({ settings: status })
		});
		return null;
	}

	async getAuthorizedApp()
	{
		var applications = [];
		var request = await fetch(`https://discord.com/api/v9/oauth2/tokens`,{ headers: this.#tokenHeader });
		var requestJson = await request.json();
		if (await requestJson.message) return await requestJson;

		for (var application of await requestJson)
		{
			var newApplication = new Application();
			await newApplication.get(this.#tokenHeader, await application);
			applications.push(await newApplication)
		}
		return await applications;
	}


};

