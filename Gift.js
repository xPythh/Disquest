const fetch = require("node-fetch");


module.exports = class {

	#tokenHeader;

	async get(header, gift)
	{
		this.#tokenHeader = header;
		try {
			for (var key of Object.keys(gift)) this[key] = gift[key];

			var request = await fetch(`https://discord.com/api/v9/users/@me/entitlements/gift-codes?sku_id=${this.sku_id}`, { headers: this.#tokenHeader });
			var requestJson = await request.json();
			if (await requestJson.message) return await requestJson;

			if (await requestJson.length > 0)
				for (var key of Object.keys(await requestJson[0])) 
					this[key] = await requestJson[0][key];
			
			return this;
		} catch (ex) {
			console.log(ex);
			return await this.get(header, gift);
		}
	}

	async generate()
	{
		try {
			var tempTokenHeader = Object.assign({}, this.#tokenHeader);
			tempTokenHeader["content-type"] = "application/json";

			var request = await fetch(`https://discord.com/api/v9/users/@me/entitlements/gift-codes`,
			{
				method: "POST",
				headers: tempTokenHeader,
				body: JSON.stringify({
					gift_style: null,
					sku_id: this.sku_id,
					subscription_plan_id: this.subscription_plan.id
				})
			})	
			var requestJson = await request.json();
			for (var key of Object.keys(await requestJson)) this[key] = await requestJson[key];

			return await requestJson;
		} catch (ex) {
			console.log(ex);
			return await this.generate();
		}
	}

	async claim()
	{
		try {
			var tempTokenHeader = Object.assign({}, this.#tokenHeader);
			tempTokenHeader["content-type"] = "application/json";
			var request = await fetch(`https://discord.com/api/v9/entitlements/gift-codes/${this.code}/redeem`,
			{
				method: "POST",
				headers: tempTokenHeader,
				body: JSON.stringify({ channel_id: null, payment_source_id: null })
			});
			var requestJson = await request.json();
			return await requestJson;
		} catch (ex) {
			console.log(ex);
			return await this.claim();
		}
	}

	async revoke()
	{
		try {
			await fetch(`https://discord.com/api/v9/users/@me/entitlements/gift-codes/${this.code}`,
			{
				method: "DELETE",
				headers: this.#tokenHeader
			});
		} catch (ex) {
			return await this.revoke();
		}
	}

}