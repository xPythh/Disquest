const fetch = require("node-fetch");


module.exports = class {

	#tokenHeader;

	async get(header, boost)
	{
		this.#tokenHeader = header;

		for (var key of Object.keys(boost)) 
			this[key] = boost[key];
		
		return this;
	}


	async removeFromServer()
	{
		try {
			if (!this.premium_guild_subscription)
				throw new Error(`Boost is not linked on any server`)
			await fetch(`https://discord.com/api/v9/guilds/${this.premium_guild_subscription.guild_id}/premium/subscriptions/${this.premium_guild_subscription.id}`,
			{
				method: "DELETE",
				headers: this.#tokenHeader
			});
			return null;
		} catch (ex) {
			console.log(ex);
			return await this.removeFromServer();
		}
	}

	async putOnServer(guildId)
	{
		var tempTokenHeader = Object.assign({}, this.#tokenHeader);
		tempTokenHeader["content-type"] = "application/json";
		try {
			var request = await fetch(`https://discord.com/api/v9/guilds/${guildId}/premium/subscriptions`,
			{
				method: "PUT",
				headers: tempTokenHeader,
				body: JSON.stringify({ user_premium_guild_subscription_slot_ids: [this.id] })
			});
			var requestJson = await request.json();
			return await requestJson;
		} catch (ex) {
			console.log(ex);
			return await this.putOnServer(guildId);
		}
	}

	async transfertToServer(guildId)
	{
		await removeFromServer();
		await putOnServer(guildId);
		return null;
	}

}