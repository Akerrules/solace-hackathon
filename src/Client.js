import * as solace from "solclientjs";

// Statically initialize solclientjs. This is required for SolclientFactory to work
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

// Class Client wraps a connection to a Solace broker. It is automatically configured with
// the credentials stored in .env and unique to this application.
// Nothing really needs to be changed here.
class Client {

    constructor(onConnectCallback, onDisconnectCallback) {
        this.session = null;
        this.onConnectCallback = onConnectCallback;
        this.onDisconnectCallback = onDisconnectCallback;

        this.topicSeparator = "/";
        this.topicLevelWildcard = "*";
        this.topicAllLevelsWildcard = ">";
    }

    // Lifecycle methods for connect and disconnect

    // connect will connect in a blocking manner
    async connect() {
        this.subscriptions = [];
        this.subPrefixes = [];
        this.subExactMatches = [];
        this.subWildcards = [];
        this.subRefCounts = {};
        this.subIdToSubscription = {};
        this.subscribeCorrelations = {};
        this.unsubscribeCorrelations = {};
        this.subSeq = 1;

        if (this.session !== null) {
            console.warn("Session already connected");
            return;
        }
        try {
            // Note: these properties have been preconfigured for you
            this.session = solace.SolclientFactory.createSession({
                url: process.env.REACT_APP_SOLACE_HOST,
                vpnName: process.env.REACT_APP_SOLACE_VPN,
                userName: process.env.REACT_APP_SOLACE_USERNAME,
                password: process.env.REACT_APP_SOLACE_PASSWORD,
            });
        } catch (error) {
            console.warn("Error connecting: " + error.toString());
            return;
        }
        // Bind event handlers
        this.session.on(solace.SessionEventCode.UP_NOTICE, (sessionEvent) => this.onConnect(sessionEvent));
        this.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (sessionEvent) => this.onConnectFailed(sessionEvent));
        this.session.on(solace.SessionEventCode.DISCONNECTED, (sessionEvent) => this.onDisconnect(sessionEvent));
        this.session.on(solace.SessionEventCode.MESSAGE, (message) => this.onMessage(message));
        this.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, (correlation) => this.onSubscriptionOk(correlation));
        this.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, (correlation) => this.onSubscriptionError(correlation));

        try {
            let that = this;
            let connectPromise = new Promise((resolve, reject) => {
                that.connectResolve = resolve;
                that.connectReject = reject;
            })
            this.session.connect();
            await connectPromise;
        } catch (error) {
            console.warn("Failed to connect: " + error.toString());
        }
    }

    async disconnect() {
        if (this.session !== null) {
            let that = this;
            let disconnectPromise = new Promise((resolve) => {
                that.disconnectResolve = resolve;
            })
            this.session.disconnect();
            await disconnectPromise;
        }
    }

    // Lifecycle method callbacks for when the session state changes

    onMessage(message) {
        let topic = message.getDestination().getName();
        let cbs = this.getMessageCallbacks(topic);
        cbs.forEach(cb => cb(topic, message));
    }

    onConnect(sessionEvent) {
        console.info('=== Successfully connected and ready to publish and receive messages. ===');
        if (this.onConnectCallback) {
            this.onConnectCallback(sessionEvent);
        }
        this.connectResolve();
    }

    onConnectFailed(sessionEvent) {
        console.warn('Connection failed to the message router: ' + sessionEvent.infoStr +
            ' - check correct parameter values and connectivity!');
        this.connectReject(sessionEvent.infoStr);
    }

    onDisconnect(sessionEvent) {
        console.info('Disconnected.');
        if (this.session !== null) {
            this.session.dispose();
            this.session = null;
        }
        if (this.onDisconnectCallback) {
            this.onDisconnectCallback(sessionEvent);
        }
        if (this.disconnectResolve) {
            this.disconnectResolve();
        }
    }

    // Messaging methods

    publish(topic, text) {
        if (this.session !== null) {
            // Start a new message, set the destination to the topic and the attachment to the text
            var message = solace.SolclientFactory.createMessage();
            message.setDestination(solace.SolclientFactory.createTopicDestination(topic));
            message.setBinaryAttachment(text);
            message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);

            console.info('Publishing message "' + text + '" to topic "' + topic + '"...');
            try {
                this.session.send(message);
                console.info('Message published successfully');
            } catch (error) {
                console.warn(error.toString());
            }
        } else {
            console.warn('Cannot publish because not connected to Solace PubSub+ Event Broker.');
        }
    }

    // subscribe will add a subscription for the given topic and set the event callback for messages
    // to the given callback
    async subscribe(subscription, callback) {
        if (this.session !== null) {
            console.info('Subscribing to topic subscription: ' + subscription);
            try {
                let subId = this.subSeq++;
                let that = {};
                let subscribePromise = new Promise((resolve, reject) => {
                    that.resolve = resolve;
                    that.reject = reject;
                })
                this.subscribeCorrelations[subId] = that;

                this.session.subscribe(
                    solace.SolclientFactory.createTopicDestination(subscription),
                    true, // generate confirmation when subscription is added successfully
                    subId, // use sub ID as correlation key
                    10000 // 10 seconds timeout for this operation
                );
                this.subscriptions.push({ sub: subscription, callback: callback, id: subId })
                if (callback) {
                    this.learnSubscription(subscription, callback, subId);
                }

                this.subRefCounts[subId] = this.subRefCounts[subId] ? this.subRefCounts[subId]++ : 1;
                this.subIdToSubscription[subId] = [subscription];

                await subscribePromise;
                return subId;
            } catch (error) {
                console.warn(error.toString());
            }
        } else {
            console.warn('Cannot subscribe because not connected to Solace PubSub+ Event Broker.');
        }
        return -1;
    }

    onSubscriptionOk(event) {
        if (this.subscribeCorrelations[event.correlationKey]) {
            this.subscribeCorrelations[event.correlationKey].resolve();
            delete (this.subscribeCorrelations[event.correlationKey]);
        } else if (this.unsubscribeCorrelations[event.correlationKey]) {
            this.unsubscribeCorrelations[event.correlationKey].resolve();
            delete (this.unsubscribeCorrelations[event.correlationKey]);
        }
    }

    onSubscriptionError(event) {
        if (this.subscribeCorrelations[event.correlationKey]) {
            this.subscribeCorrelations[event.correlationKey].reject();
            delete (this.subscribeCorrelations[event.correlationKey]);
        } else if (this.unsubscribeCorrelations[event.correlationKey]) {
            this.unsubscribeCorrelations[event.correlationKey].reject();
            delete (this.unsubscribeCorrelations[event.correlationKey]);
        }
    }

    async unsubscribe(subId) {
        this.unlearnSubScription(subId);
        this.subRefCounts[subId]--;
        if (!this.subRefCounts[subId]) {
            delete (this.subRefCounts[subId]);
            if (this.subIdToSubscription[subId]) {
                let subscription = String(this.subIdToSubscription[subId]);
                if (this.session) {
                    // Unsubscribe on the session for Solace messaging
                    try {
                        let that = {};
                        let unsubscribePromise = new Promise((resolve, reject) => {
                            that.resolve = resolve;
                            that.reject = reject;
                        })
                        this.unsubscribeCorrelations[subId] = that;

                        this.session.unsubscribe(
                            solace.SolclientFactory.createTopicDestination(subscription),
                            true, // generate confirmation when subscription is removed successfully
                            subId, // use topic name as correlation key
                            10000 // 10 seconds timeout for this operation
                        );
                        await unsubscribePromise;
                    } catch (error) {
                        console.log(error);
                    }
                }
                delete (this.subIdToSubscription[subId]);
            }
            else {
                console.log("Tried to unsubscribe from subId:", subId)
            }
        }
    }

    getMessageCallbacks(topic) {
        let cbs = [];
        this.subPrefixes.forEach(item => {
            if (topic.startsWith(item.prefix)) {
                cbs.push(item.callback);
            }
        })
        this.subExactMatches.forEach(item => {
            if (topic == item.sub) {
                cbs.push(item.callback);
            }
        })
        if (this.subWildcards.length) {
            let topicParts = topic.split(this.topicSeparator);
            this.subWildcards.forEach(item => {
                let subParts = item.subParts;
                let match = true;
                for (let i = 0; i < subParts.length; i++) {
                    if (subParts[i] === this.topicAllLevelsWildcard) {
                        break;
                    }
                    if (topicParts[i] !== subParts[i]) {
                        if (subParts[i] !== this.topicLevelWildcard) {
                            // if subParts[i] ends with a wildcard, then find if all the characters before the wildcard match
                            // if not, then we don't match
                            if (subParts[i].endsWith(this.topicLevelWildcard)) {
                                let subPart = subParts[i].substring(0, subParts[i].length - 1);
                                if (topicParts[i].startsWith(subPart)) {
                                    continue;
                                }
                            }
                            match = false;
                            break;
                        }
                    }
                }
                if (match) {
                    cbs.push(item.callback);
                }
            })
        }
        return cbs;
    }

    learnSubscription(subscription, callback, subId) {
        if (subscription.match(new RegExp("\\" + this.topicLevelWildcard))) {
            this.subWildcards.push({
                subParts: subscription.split(this.topicSeparator),
                callback: callback,
                id: subId
            })
        } else if (subscription.endsWith("/" + this.topicAllLevelsWildcard)) {
            this.subPrefixes.push({
                prefix: subscription.replace(new RegExp("/" + this.topicAllLevelsWildcard + "$"), ""),
                callback: callback,
                id: subId
            })
        } else if (subscription === ">") {
            this.subPrefixes.push({
                prefix: "",
                callback: callback,
                id: subId
            })
        } else {
            this.subExactMatches.push({
                sub: subscription,
                callback: callback,
                id: subId
            })
        }
    }

    unlearnSubScription(subId) {
        this.subWildcards = this.subWildcards.filter(s => s.id != subId);
        this.subPrefixes = this.subPrefixes.filter(s => s.id != subId);
        this.subExactMatches = this.subExactMatches.filter(s => s.id != subId);
    }

}

export default Client;