const 
Imap = require('imap'),
MailParser = require('mailparser').MailParser,
EventEmitter = require('events').EventEmitter;

module.exports = class ImapListener extends EventEmitter {
	/**
	 * Listens for new emails, emits "mail" and "err" events.
	 * @param {{ user: string, password: string, host: string, port: number, tls: boolean, mailbox: string, tlsOptions: {rejectUnauthorized: boolean}, markSeen: boolean }} options 
	 */
	constructor(options) {
		super()
		this.options = options
		this.imap = new Imap(options)
	}
	start = () => new Promise((res, rej) => {
		this.imap.once('ready', () => {
			this.imap.openBox(this.options.mailbox||"INBOX", false, err => {
				if (err) rej(err)
				this.imap.on('mail', this.fetchUnseen);
				this.fetchUnseen()
				res()
			})
		})
		this.imap.connect();
		
	})
	stop = () => this.imap.end()

	fetchUnseen = () => {
		this.imap.search(['UNSEEN'], (err, seachResults) => {
			if (err) return this.emit('err', err)
			
			if (!seachResults || seachResults.length === 0) return
	
			const fetch = this.imap.fetch(seachResults, {
				markSeen: this.options.markSeen,
				bodies: ''
			});
			fetch.on('message', msg => {
				let uid, flags;
				msg.on('attributes', attrs => {                                                           
					uid = attrs.uid;
					flags = attrs.flags;
				});

				let mailParser = new MailParser();
				mailParser.once('end', mail => {
					mail.uid = uid;
					mail.flags = flags;
					this.emit('mail', mail);
				});
				msg.once('body', stream => stream.pipe(mailParser));
			});
			fetch.once('error', err => this.emit('err', err))
		});
	}
}