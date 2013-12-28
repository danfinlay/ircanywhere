EventManager = function() {
	"use strict";

	var hooks = Meteor.require('hooks'),
		_insert = function(client, message, type, tab) {
			if (!message.channel && !message.target) {
				var id = client._id;
			} else {
				var id = (!message.channel) ? client.internal.tabs[message.target].key : client.internal.tabs[message.channel].key;
			}
			
			var output = {
				type: type,
				user: client.userId,
				tab: id,
				message: message,
				read: false,
				extra: {
					highlight: false,
					prefix: ''
				}
		};

		Events.insert(output);
	};

	var Manager = {
		init: function() {
			Events.allow({
				update: function (userId, doc, fields, modifier) {	
					return doc.user === userId;
				},
				fetch: ['user']
			});
			// allow our events documents to be changed by us
		},

		insertEvent: function(client, message, type) {
			var self = this;

			if (type == 'nick' || type == 'quit') {
				var chans = ChannelUsers.find({network: client.name, nickname: message.nickname});
				// find the channel, we gotta construct a query (kinda messy)

				chans.forEach(function(chan) {
					message.channel = chan.channel;
					_insert(client, message, type, chan._id);
					// we're in here because the user either changing their nick
					// or quitting, exists in this channel, lets add it to the event
				});

				if (_.has(client.internal.tabs, message.nickname)) {
					_insert(client, message, type, client.internal.tabs[message.nickname]);
				}
				// these two types wont have a target, or a channel, so
				// we'll have to do some calculating to determine where we want them
				// we shall put them in channel and privmsg tab events
			} else {
				_insert(client, message, type, client.internal.tabs[message.target] || client._id);
			}
		}
	};

	Manager.init();

	return _.extend(Manager, hooks);
};