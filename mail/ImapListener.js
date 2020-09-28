const 
Imap = require('imap'),
MailParser = require('mailparser').MailParser;

module.exports = class ImapListener extends Imap {
	/**
	 * Listens for new emails, emits "mail" and "err" events.
	 * @param {{ user: string, password: string, host: string, port: number, tls: boolean, mailbox: string, tlsOptions: {rejectUnauthorized: boolean}, markSeen: boolean }} options 
	 */
	constructor(options) {
		super(options)
		this._opts = options
	}
	start = () => new Promise((res, rej) => {
		this.once('ready', () => {
			this.openBox(this._opts.mailbox||"INBOX", false, err => {
				if (err) rej(err)
				this.on('mail', this.fetchUnseen);
				this.fetchUnseen()
				res()
			})
		})
		this.connect();
		
	})
	stop = () => new Promise((res, rej) => {
		this.on('close', res)
		this.end()
	})

	fetchUnseen = () => {
		this.search(['UNSEEN'], (err, seachResults) => {
			if (err) return this.emit('error', err)
			
			if (!seachResults || seachResults.length === 0) return
	
			const fetch = this.fetch(seachResults, {
				markSeen: this._opts.markSeen,
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
			fetch.once('error', err => this.emit('error', err))
		});
	}
}