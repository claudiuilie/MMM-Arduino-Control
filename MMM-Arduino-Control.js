/* global Module */

/* Magic Mirror
 * Module: MMM-Arduino-Control
 *
 * By Claudiu Ilie
 * MIT Licensed.
 */


Module.register("MMM-Arduino-Control", {
	defaults: {
		updateInterval: 10 * 60 * 1000,
		retryDelay: 5000,
		animationSpeed: 2000,
		urlApi:"http://192.168.1.103/sensors"

	},

	getStyles: function () {
		return ["font-awesome_5.css", "weather-icons.css", "MMM-Arduino-Control.css"];
	},

	start: function () {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;
		this.loaded = false;
		this.getData(this.defaults.urlApi);
		setInterval(function () {
			self.updateDom();
		}, this.config.updateInterval);
	},

	getData: function (urlApi) {
		var self = this;
		var retry = true;

		var dataRequest = new XMLHttpRequest();
		dataRequest.open("GET", urlApi, true);
		dataRequest.onreadystatechange = function () {

			if (this.readyState === 4) {

				if (this.status === 200) {
					self.processData(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					Log.error(self.name, this.status);
					retry = false;
				} else {
					Log.error(self.name, "Could not load data.");
				}
				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		dataRequest.send();

	},

	scheduleUpdate: function (delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad;
		var self = this;
		setTimeout(function () {
			self.getData();
		}, nextLoad);
	},

	getDom: function () {

		var wrapper = document.createElement("div");
		if (this.dataRequest) {
			var sensors = document.createElement("table");
			var relays = document.createElement("table");

			for (var i = 0; i < this.dataRequest.length; i++) {
				if(this.dataRequest[i].temp > 1){
				    let icon = this.dataRequest[i].icon;
				    console.log(icon)

					switch(icon) {
						case "fas fa-utensils":
							icon = "fa fa-cutlery"
							break;
						case "fas fa-bed":
							icon = "fa fa-bed"
							break;
						case "fas fa-couch":
							icon = "fa fa-television"
							break;
					}
					console.log(this.dataRequest[i])
					sensors.insertAdjacentHTML('afterbegin',
				`<tr><td><i class = "${icon}"></i></td>
				<td><span>${this.dataRequest[i].temp + "°"}&nbsp;</span></td>
				<td><span>${this.dataRequest[i].humidity }&nbsp;</span></td>
				<td><i class ="wi wi-humidity humidityIcon"></i></td></tr>`
				);
				}
			}

			// relays.insertAdjacentHTML('afterbegin',
			// 	`<header>Lights Status &nbsp;&nbsp;</header>
			// 	<tr>
			// 		<td>
			// 			<span>Kitchen Led &nbsp;<span>
			// 			<i class="far fa-lightbulb" style="color:${bulbColor};"></i>
			// 		<td>
			// 	</tr>`
			// );

			wrapper.appendChild(sensors);
			wrapper.appendChild(relays);
		}

		return wrapper;
	},


	getStyles: function () {
		return [
			"MMM-Arduino-Control.css",
		];
	},
	processData: function (data) {
		var self = this;
		this.dataRequest = JSON.parse(data.sensors);
		if (this.loaded === false) { self.updateDom(self, this.config.animationSpeed); }
		this.loaded = true;
		this.sendSocketNotification("MMM-Arduino-Control-NOTIFICATION_TEST", data);
	},

	socketNotificationReceived: function (notification, payload) {
		console.log(notification);
		if (notification === "MMM-Arduino-Control-NOTIFICATION_TEST") {
			this.dataNotification = payload;
			this.updateDom();
		}

	},

	notificationReceived: function (notification, payload, sender) {
		var self = this;
		if (notification === "FURNITURELED_ON" || notification === "FURNITURELED_OFF") {
			self.getData(payload.urlApi);
			self.updateDom(self.config.animationSpeed);
		}
	}

});


