var restify = require('restify');
var builder = require('botbuilder');
var host = "https://gdgbot.azurewebsites.net/images/";


if (process.env.DEV == 'DEV') {

    var connector = new builder.ConsoleConnector().listen();
    var bot = new builder.UniversalBot(connector);

} else {

    // Create bot and add dialogs
    var connector = new builder.ChatConnector({
        appId: '2ec83f66-8f45-4852-82cf-cf1602225bd9',
        appPassword: '1Ujqf1p5129WNHQujUCik62'
    });

    var bot = new builder.UniversalBot(connector);
    // Setup Restify Server
    var server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3978, function() {
        console.log('%s listening to %s', server.name, server.url);
    });

    server.post('/api/messages', connector.listen());

    server.get('/home', function(req, res) {
        res.send("server is running test by rest api");
    });

    server.get(/\/images\/?.*/, restify.serveStatic({
        directory: './media'
    }));
    server.get(/\/static\/?.*/, restify.serveStatic({
        directory: './media'
    }));
    ///=========================================================
    // Activity Events
    //=========================================================

    bot.on('conversationUpdate', function(message) {
        // Check for group conversations
        if (message.address.conversation.isGroup) {
            // Send a hello message when bot is added
            if (message.membersAdded) {
                message.membersAdded.forEach(function(identity) {
                    if (identity.id === message.address.bot.id) {
                        var reply = new builder.Message()
                            .address(message.address)
                            .text("Hello everyone!");
                        bot.send(reply);
                    }
                });
            }

            // Send a goodbye message when bot is removed
            if (message.membersRemoved) {
                message.membersRemoved.forEach(function(identity) {
                    if (identity.id === message.address.bot.id) {
                        var reply = new builder.Message()
                            .address(message.address)
                            .text("Goodbye");
                        bot.send(reply);
                    }
                });
            }
        }
    });

    bot.on('contactRelationUpdate', function(message) {
        if (message.action === 'add') {
            var name = message.user ? message.user.name : null;
            var reply = new builder.Message()
                .address(message.address)
                .text("Thanks for adding me. Say 'hello' to see some great demos.");
            bot.send(reply);
        } else {
            // delete their data
        }
    });

    bot.on('deleteUserData', function(message) {
        // User asked to delete their data
    });


    //=========================================================
    // Bots Middleware
    //=========================================================

    // Anytime the major version is incremented any existing conversations will be restarted.
    bot.use(builder.Middleware.dialogVersion({
        version: 1.0,
        resetCommand: /^reset/i
    }));

    //=========================================================
    // Bots Global Actions
    //=========================================================

    bot.endConversationAction('goodbye', 'Goodbye :)', {
        matches: /^goodbye/i
    });
    bot.beginDialogAction('help', '/help', {
        matches: /^help/i
    });


}

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function(session) {
        // Send a greeting and show help.
        var card = new builder.HeroCard(session)
            .title("GDG BOT")
            .text("Your personal assistent for GDG Devfest HYD 2016.")
            .images([
                builder.CardImage.create(session, "https://i.imgsafe.org/d0d9babd36.png")
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.beginDialog("/profile");
        //session.beginDialog('/help');

    },
    function(session, results) {
        // Display menu
        session.beginDialog('/menu');
    },
    function(session, results) {
        // Always say goodbye
        session.send("Ok... See you later!");
    }
]);

bot.dialog('/profile', [
    function(session) {
        session.send("Hi.. I'm your personal assistent bot for GDG Devfest HYD. I am glad you are here.");
        builder.Prompts.text(session, 'What is your name ?');
    },
    function(session, results) {
        session.userData.name = results.response;
        session.send('Hello %s!', session.userData.name);
        session.endDialog();
    }
]);

bot.dialog('/menu', [
    function(session) {
        builder.Prompts.choice(session, session.userData.name + " , How can I help you today ?", "About|Schedule|Speakers|Gallery|Sponser|Venue|Team");
    },
    function(session, results) {
        if (results.response && results.response.entity != '(quit)') {
            // Launch demo dialog

            session.beginDialog('/' + results.response.entity);
        } else {
            // Exit the menu
            session.endDialog();
        }
    },
    function(session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/menu');
    }
]).reloadAction('reloadMenu', null, {
    matches: /^menu|show menu/i
});

bot.dialog('/help', [
    function(session) {
        session.endDialog("Global commands that are available anytime:\n\n* menu - Exits a demo and returns to the menu.\n* goodbye - End this conversation.\n* help - Displays these commands.");
    }
]);




bot.dialog('/About', [
    function(session) {

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                .title("GDG HYDERABAD DEVFEST")
                //.subtitle("Space Needle")
                .text("GDG DevFests are large, community-run events that can offer speaker sessions across multiple product areas, all-day hack-a-thons, code labs, and more. Each GDG DevFest will be inspired by and uniquely tailored to the needs of the developer community that hosts it. " +

                    +" GDG Hyderabad celebrates the spirit of being a developer. Hyderabad DevFest can be considered as “Technical Diwali” that celebrates the achievements of computing world and the constant urge to connect, code and innovate."

                    + " GDG Hyderabad believes that technology is not only easy to apply in our daily lives but it is also easy to build one on our own. And since, to learn something there are no constraints, anyone can attend the session and  get a hands-on idea of the the latest developments of technical world.")
                .images([
                    builder.CardImage.create(session, host + "gdglogo-4.jpg")
                ])
                //.tap(builder.CardAction.openUrl(session, ""))
            ]);
        session.send(msg);

        session.endDialog();
    }
]);

bot.dialog('/Schedule', [
    function(session) {

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.ThumbnailCard(session)
                .title("Welcome Address")
                .subtitle("10:00 - 10:30 AM")
                .text("")
                .images([
                    builder.CardImage.create(session, host + "google-1-1-180x180.png")

                ]),


                new builder.ThumbnailCard(session)
                .title("Getting Started with Kubernetes")                
                .subtitle("10:30 - 11:15 AM")
                .text("by Mr. Janakiram MSV, Analyst, Advisor & Architect at Janakiram & Associates ")
                .images([
                    builder.CardImage.create(session, host + "kubernetes-180x180.jpg")
                ]),



                new builder.ThumbnailCard(session)
                .title("India and VR - Challenges and Opportunities")
                .subtitle("11:30 - 12:15 PM")
                .text("by Mr. Jignesh Talasila, Founder & CEO, Loop Reality")
                .images([
                    builder.CardImage.create(session, host + "vr-icon-180x180.png")
                ]),


                new builder.ThumbnailCard(session)                
                .subtitle("12:15 - 01:00 PM")
                .title("Firebase Overview")
                .text("by Mr. Mustafa Ali, Director of Technology, Mutual Mobile")
                .images([
                    builder.CardImage.create(session, host + "android-1-180x180.png")
                ])
            ]);
        session.send(msg);



        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.ThumbnailCard(session)
                .title("Build Real-time Web App using Angular 2 & Firebase")            
                .subtitle("01:30 - 02:30 PM")
                .text("by Mr. Keerti Kotaru & Mr. Ravi Kiran, ng-Hyderabad")
                .images([
                    builder.CardImage.create(session, host + "ng-fire-180x180.png")
                ]),



                new builder.ThumbnailCard(session)
                .title("Javascript & IoT (Internet of Things)")                           
                .subtitle("02:30 - 03:15 PM")
                .text("by Mr. Arvind Ravulavaru, The IoT Suitcase")
                .images([
                    builder.CardImage.create(session, host + "m2m-icon-336-300x300-180x180.png")
                ]),



                new builder.ThumbnailCard(session)
                .title("Introduction to LLVM Compiler Infrastructer")                          
                .subtitle("03:15 - 04:00 PM")
                .text("by Mr. Utpal Bora & Mr. Pratik Bhatu")
                .images([
                    builder.CardImage.create(session, host + "unnamed-2-180x180.png")
                ]),


                new builder.ThumbnailCard(session)                          
                .subtitle("04:15 - 05:15 PM")
                .title("Getting started with Machine Learning")
                .text("by Mr. Anudeep Sai, GDG Hyderabad")
                .images([
                    builder.CardImage.create(session, host + "Machine-1-180x180.jpg")
                ])
            ]);
        session.send(msg);



        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.ThumbnailCard(session)
                .title("Code Lab on BOTS - Future of Apps")                                        
                .subtitle("01:30 - 02:30 PM")
                .text("by Mr. Gaurav Sharma, Pramati Technologies")
                .images([
                    builder.CardImage.create(session, host + "unnamed-1-180x180.png")
                ]),



                new builder.ThumbnailCard(session)
                .title("MVVM Architecture with Dagger 2 & Databinding")                                       
                .subtitle("02:30 - 03:15 PM")
                .text("by Mr. Tushar Acharya, Mutual Mobile")
                .images([
                    builder.CardImage.create(session, host + "unnamed-180x180.png")
                ]),



                new builder.ThumbnailCard(session)
                .title("How ‘NOT-TO’ Develop Apps")
                .subtitle("03:15 - 04:00 PM")
                .text("by Mr. Surya & Mr. Kaushik, Primeauth")
                .images([
                    builder.CardImage.create(session, host + "Primeauth-180x180.png")
                ]),


                new builder.ThumbnailCard(session)
                .title("Code Lab on RxAndroid")
                .subtitle("04:15 - 05:15 PM")
                .text("by Mr. Raviteja, Hug Innovations")
                .images([
                    builder.CardImage.create(session, host + "RxAndroid-180x180.png")
                ])
            ]);
        session.send(msg);


        session.endDialog();
    }
]);


bot.dialog('/Gallery', [
    function(session) {



        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                .title("")
                .text("")
                .images([])
                .buttons([
                    builder.CardAction.openUrl(session, "https://plus.google.com/photos/114190263289122404629/albums/6223696620835289329", "GDG Devfest 2015"),
                    builder.CardAction.openUrl(session, "https://plus.google.com/events/gallery/c0eugd0po6qv9jlf3ji31pm35dk", "GDG Devfest 2014"),
                    builder.CardAction.openUrl(session, "https://plus.google.com/photos/114190263289122404629/albums/6330843510147583633", "GDG Devfest 2013"),
                    builder.CardAction.openUrl(session, "https://plus.google.com/events/gallery/c4vaokuckf0qs1v42gbjnmlg0ts?sort=1", "GDG Devfest 2012"),
                ])
            ]);
        bot.send(msg);

        session.endDialog();

    }
]);

bot.dialog('/Sponser', [
    function(session) {



        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                .title("")
                .text("")
                .images([
                    builder.CardImage.create(session, host + "googledevelopers-1.png"),
                ])
                .buttons([])
            ]);
        bot.send(msg);


        msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                .title("")
                .text("")
                .images([
                    builder.CardImage.create(session, host + "google-1.png"),
                ])
                .buttons([])
            ]);
        bot.send(msg);

        msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                .title("")
                .text("")
                .images([
                    builder.CardImage.create(session, host + "ng.png"),
                ])
                .buttons([])
            ]);
        bot.send(msg);

        msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                .title("")
                .text("")
                .images([
                    builder.CardImage.create(session, host + "Studio-Torque.png"),
                ])
                .buttons([])
            ]);
        bot.send(msg);

        session.endDialog();


    }
]);


bot.dialog('/Venue', [
    function(session) {

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                .title("")
                .text("")
                .images([
                    builder.CardImage.create(session, host + "place.png")
                    .tap(builder.CardAction.openUrl(session, "https://www.google.co.in/maps/place/Google/@17.458937,78.3714451,17z/data=!3m1!5s0x3bcb93cfcfec28ef:0xc0a2814c699c356f!4m13!1m7!3m6!1s0x3bcb93cfd7adcc4d:0x5c7c79f370c8bf7!2sDivyaSree+Omega+Hi-Tech+City+Hyderabad!3b1!8m2!3d17.458937!4d78.3736338!3m4!1s0x0:0xcfcead772f6ce1c9!8m2!3d17.4583639!4d78.3724543"))
                ])
                .buttons([])

            ]);
        bot.send(msg);


        session.endDialog();


    }
]);



bot.dialog('/Speakers', [
    function(session) {
        //session.send("You can pass a custom message to Prompts.choice() that will present the user with a carousel of cards to select from. Each card can even support multiple actions.");

        // Ask the user to select an item from a carousel.
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                .title("Jignesh Talasila")
                .subtitle("Founder & CEO")
                .text("Loop Reality")
                .images([
                    builder.CardImage.create(session, host + "198c3b3.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/jigneshtalasila")),
                ]),

                new builder.HeroCard(session)
                .title("Janakiram MSV")
                .subtitle("Analyst, Advisor & Architect")
                .text("Janakiram & Associates")
                .images([
                    builder.CardImage.create(session, host + "3d2613b.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/janakiramm")),
                ]),


                new builder.HeroCard(session)
                .title("Mustafa Ali")
                .subtitle("Director of Technology")
                .text("Mutual Mobile")
                .images([
                    builder.CardImage.create(session, host + "767705.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/mustafa01ali")),
                ]),


                new builder.HeroCard(session)
                .title("Keerti Kotaru")
                .subtitle("Principal Architect")
                .text("Cognizant")
                .images([
                    builder.CardImage.create(session, host + "keerthikotaru.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/keertikotaru")),
                ]),

                new builder.HeroCard(session)
                .title("Ravi Kiran")
                .subtitle("Senior Engineer - UI")
                .text("Innominds")
                .images([
                    builder.CardImage.create(session, host + "rabikiran.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/s-rabi-kiran-52257a24")),
                ])

            ]);
        session.send(msg);

        //==================
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                .title("Guarav Sharma")
                .subtitle("Sr. Development Engineer")
                .text("Pramati Technologies")
                .images([
                    builder.CardImage.create(session, host + "gaurav.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/gaurav-sharma-0967b328")),
                ]),

                new builder.HeroCard(session)
                .title("Surya Subhash")
                .subtitle("Founder & CEO")
                .text("Primeauth")
                .images([
                    builder.CardImage.create(session, host + "subhash.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/pbssubhash/")),
                ]),


                new builder.HeroCard(session)
                .title("Arvind Ravulavaru")
                .subtitle("Platform Architect")
                .text("The IoT Suitcase")
                .images([
                    builder.CardImage.create(session, host + "arvind.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/arvindravulavaru")),
                ]),

                new builder.HeroCard(session)
                .title("Tushar Acharya")
                .subtitle("Senior Android Engineer II")
                .text("Mutual Mobile")
                .images([
                    builder.CardImage.create(session, host + "230d31b.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/ntusharacharya")),
                ]),



                new builder.HeroCard(session)
                .title("Raviteja Gadipudi")
                .subtitle("Sr. Android Developer")
                .text("Hug Innovations")
                .images([
                    builder.CardImage.create(session, host + "3385730.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/rgadipudi")),
                ])

            ]);
        session.send(msg);

        //===========
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                .title("Anudeep Sai N")
                .subtitle("Xoogler | Organizer")
                .text("GDG Hyderabad")
                .images([
                    builder.CardImage.create(session, host + "3c75bd4.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/anudeepsai")),
                ]),


                new builder.HeroCard(session)
                .title("Kaushik Bharadwaj")
                .subtitle("Founder & CTO")
                .text("Primeauth")
                .images([
                    builder.CardImage.create(session, host + "dummy-profile.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://github.com/kaushikb1996")),
                ]),


                new builder.HeroCard(session)
                .title("Utpal Bora")
                .subtitle("Research Scholar")
                .text("IIT Hyderabad")
                .images([
                    builder.CardImage.create(session, host + "Utpal.jpg")
                ]),


                new builder.HeroCard(session)
                .title("Pratik Bhatu")
                .subtitle("Student")
                .text("IIT Hyderabad")
                .images([
                    builder.CardImage.create(session, host + "dummy-profile.jpg")
                    .tap(builder.CardAction.openUrl(session, "https://www.linkedin.com/in/pratik-bhatu-51047bb6")),
                ])

            ]);
        session.send(msg);



        session.endDialog();
        //builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    }
]);



bot.dialog('/Team', [
    function(session) {
        //session.send("You can pass a custom message to Prompts.choice() that will present the user with a carousel of cards to select from. Each card can even support multiple actions.");

        // Ask the user to select an item from a carousel.
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                .title("Bharath Silagani")
                .subtitle("Community Lead")
                .images([
                    builder.CardImage.create(session, host + "Bharath-Silagani.jpg")
                ]),

                new builder.HeroCard(session)
                .title("Sindhoora M")
                .subtitle("Co-Lead")
                .images([
                    builder.CardImage.create(session, host + "3d2613b.jpg")
                ]),


                new builder.HeroCard(session)
                .title("Mustafa Ali")
                .subtitle("Director of Technology")
                .text("Mutual Mobile")
                .images([
                    builder.CardImage.create(session, host + "Sindhoora-Mokshagundam-300x300.jpg")
                ]),


                new builder.HeroCard(session)
                .title("Mustafa Ali")
                .subtitle("Lead")
                // .text("Cognizant")
                .images([
                    builder.CardImage.create(session, host + "Mustafa-Ali-300x300.jpg")
                ]),

                new builder.HeroCard(session)
                .title("Pratyusha Simharaju")
                .subtitle("Lead, Women Techmakers")
                .images([
                    builder.CardImage.create(session, host + "Pratyusha-Simharaju-300x300.jpg")
                ])

            ]);
        session.send(msg);

        //==================
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                .title("Ayush Jha")
                .subtitle("Organizer, Hydroid")
                .images([
                    builder.CardImage.create(session, host + "Ayusha-Jha-300x300.jpg")
                ]),


                new builder.HeroCard(session)
                .title("Venkata Dinesh")
                .subtitle("Organizer, Hydroid")
                .images([
                    builder.CardImage.create(session, host + "Venkata-Dinesh-min.jpg")
                ])

            ]);
        session.send(msg);



        session.endDialog();
        //builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    }
]);


// Create a dialog and bind it to a global action
bot.dialog('/weather', [
    function(session, args) {
        session.endDialog("The weather in %s is 71 degrees and raining.", args.data);
    }
]);
bot.beginDialogAction('weather', '/weather'); // <-- no 'matches' option means this can only be triggered by a button.
