/* global Module */

/* Magic Mirror
 * Module: MMM-Arduino-Control
 *
 * By Claudiu Iliee
 * MIT Licensed.
 */

Module.register("MMM-Arduino-Control", {
	defaults: {
		updateInterval: 5000,
		retryDelay: 5000,
		animationSpeed: 2000

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
		wrapper.className = "home-assistant";
		if (this.dataRequest) {

			var homeassistantLegend = document.createElement("legend");
			homeassistantLegend.className = "module-header";
			homeassistantLegend.innerHTML = "Home Assistant";
			wrapper.appendChild(homeassistantLegend);

			var sensors = document.createElement("fieldset");
			sensors.className = "sensors-assistant";
			wrapper.appendChild(sensors);

			var sensorsLegend = document.createElement("legend");
			sensorsLegend.innerHTML = "Sensors";
			sensors.appendChild(sensorsLegend);
			for (var i = 0; i < this.dataRequest.tempSensors.length; i++) {
				console.log(this.dataRequest.tempSensors[i].badge)


				sensors.insertAdjacentHTML('beforeend', `${this.dataRequest.tempSensors[i].badge}<strong id="bedroomTempValue"><span class="badge bedroom">${this.dataRequest.tempSensors[i].temp} ${this.dataRequest.tempSensors[i].unit}</span></strong></br >`)
			}
			var relays = document.createElement("fieldset");
			relays.className = "relays-assistant";

			var relaysLegend = document.createElement("legend");
			relaysLegend.innerHTML = this.dataRequest.relayStatus.bedroom.status;
			relays.appendChild(relaysLegend);
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
		console.log(data);
		console.log(this.dataRequest)
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
		console.log(notification);
		if (notification === "MMM-Arduino-Control-NOTIFICATION_TEST") {
			// set dataNotification

			this.dataNotification = payload;
			this.updateDom();
		}
	},
});
