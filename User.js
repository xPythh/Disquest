const fetch = require("node-fetch");



var User = class
{
	#tokenHeader;

	async get(header, user)
	{

		this.#tokenHeader = header;

		for (var key of Object.keys(user))
			this[key] = await user[key];

		return this;
	}

	async send(message)
	{
		if (typeof message === 'string')
			message = { content: message };

		try {
			var tempTokenHeader = Object.assign({}, this.#tokenHeader);
			tempTokenHeader["content-type"] = "application/json";

			if (!this.channelId)
			{
				var request = await fetch("https://discord.com/api/v9/users/@me/channels", 
				{  
					method: "POST",
					headers: tempTokenHeader,
					body: JSON.stringify({ recipients: [ this.id ] }) 
				});
				var requestJson =  await request.json();
				if (await requestJson.message) return await requestJson;
				this.channelId = await requestJson.id;
			}

			var request = await fetch(`https://discord.com/api/v9/channels/${await this.channelId}/messages`,
			{
				method: "POST",
				headers: tempTokenHeader,
				body: JSON.stringify(message)
			});
			var requestJson =  await request.json();
			return await requestJson;

		} catch (ex) {
			console.log(send)
			return await this.send(channelId, message);
		}
	}

	async block(shouldBlock)
	{
		try {
			if (!shouldBlock) return await this.removeFriend(); // Removing a friend = Deleting, same for unblock, so we use the same method

			var tempTokenHeader = Object.assign({}, this.#tokenHeader);
			tempTokenHeader["content-type"] = "application/json";
			await fetch(`https://discord.com/api/v9/users/@me/relationships/${this.id}`, 
			{ 
				method: "PUT",
				headers: tempTokenHeader,
				body: JSON.stringify({ type: 2 })
			});
			return null;
		} catch (ex) {
			console.log(ex)
			return await this.block(shouldBlock);
		}
	}

	async addFriend()
	{
		try {
			var tempTokenHeader = Object.assign({}, this.#tokenHeader);
			tempTokenHeader["content-type"] = "application/json";
			await fetch(`https://discord.com/api/v9/users/@me/relationships/${this.id}`, 
			{ 
				method: "PUT",
				headers: tempTokenHeader,
				body: JSON.stringify({})
			});
			return null;
		} catch (ex) {
			console.log(ex)
			return await this.addFriend();
		}
	}

	async removeFriend()
	{
		try {
			await fetch(`https://discord.com/api/v9/users/@me/relationships/${this.id}`, 
			{ 
				method: "DELETE",
				headers: this.#tokenHeader
			});
		} catch (ex) {
			console.log(ex)
			return await this.removeFriend();
		}		
	}

	async getProfile()
	{
		try {
			var profile = null;
			var request = await fetch(`https://discord.com/api/v9/users/818734574392705054/profile?with_mutual_guilds=true`, { headers: this.#tokenHeader });
			profile = await request.json();
			if (await profile.message) return await profile;

			var request = await fetch(`https://discord.com/api/v9/users/${await profile.user.id}/relationships`, { headers: this.#tokenHeader });
			var requestJson = await request.json();
			if (await requestJson.message) return profile; // Unable to get relationships so let's just send the profile
			
			var mutualFriends = [];
			for (var mutualFriend of await requestJson)
			{
				var newUser = new User(); /* someone else */
				mutualFriends.push(await newUser.get(this.#tokenHeader, mutualFriend));				
			}
			profile.mutualFriends = await mutualFriends;

			return profile;
		} catch (ex) {
			console.log(ex);
			return await this.getProfile()
		}
	}
};
module.exports = User;