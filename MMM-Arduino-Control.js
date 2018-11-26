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

	},

	getStyles: function () {
		return ["font-awesome_5.css", "weather-icons.css", "MMM-Arduino-Control.css"];
	},

	start: function () {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;

		//Flag for check if module is loaded
		this.loaded = false;

		// Schedule update timer.
		this.getData();
		setInterval(function () {
			self.updateDom();
		}, this.config.updateInterval);
	},

	/*
	 * getData
	 * function example return data and show it in the module wrapper
	 * get a URL request
	 *
	 */
	getData: function () {
		var self = this;

		var urlApi = "http://192.168.1.200/"; // arduino ip
		var retry = true;

		var dataRequest = new XMLHttpRequest();
		dataRequest.open("GET", urlApi, true);
		dataRequest.onreadystatechange = function () {
			console.log(this.readyState);
			if (this.readyState === 4) {
				console.log(this.status);
				if (this.status === 200) {
					self.processData(JSON.parse(this.response));
					// console.log(this.response);
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


	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
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
		var self = this;

		// create element wrapper for show into the module

		var wrapper = document.createElement("div");
		if (this.dataRequest) {
			var bulbColor;
			var sensors = document.createElement("table");
			var relays = document.createElement("table");
			if (this.dataRequest.relayStatus.furnitureLed === false) {
				bulbColor = "#ffad99";
			} else {
				bulbColor = "#99ff99";
			}
			for (var i = 0; i < this.dataRequest.thSensors.length; i++) {

				sensors.insertAdjacentHTML('afterbegin',
					`<tr><td><i class = "${this.dataRequest.thSensors[i].icon}"></i></td>
				<td><span>${this.dataRequest.thSensors[i].badge}&nbsp;</span></td>
				<td><span>${this.dataRequest.thSensors[i].temp + "°"}&nbsp;</span></td>
				<td><span>${this.dataRequest.thSensors[i].humidity}&nbsp;</span></td>
				<td><i class ="wi wi-humidity humidityIcon"></i></td></tr>`
				);
			}

			relays.insertAdjacentHTML('afterbegin',
				`<header>Lights Status &nbsp;&nbsp;</header>
				<tr>
					<td>
						<span>Living Led &nbsp;<span>
						<i class="far fa-lightbulb" style="color:${bulbColor};"></i>
					<td>
				</tr>`
			);

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
		this.dataRequest = data;
		if (this.loaded === false) { self.updateDom(self, this.config.animationSpeed); }
		//<------------aici crapa
		this.loaded = true;
		this.show(this.config.animationSpeed, { lockString: this.identifier });
		// the data if load
		// send notification to helper
		this.sendSocketNotification("MMM-Arduino-Control-NOTIFICATION_TEST", data);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if (notification === "MMM-Arduino-Control-NOTIFICATION_TEST") {
			// set dataNotification

			this.dataNotification = payload;
			this.updateDom();
		}

	},
	// receive commands from other modules
	notificationReceived: function (notification, payload, sender) {
		var self = this;
		if ((notification === "FURNITURELEDON" || notification === "FURNITURELEDOFF") && sender.name === "MMM-Remote-Control") {
			self.getData();
			self.updateDom(self.config.animationSpeed);
		}
	}
});
