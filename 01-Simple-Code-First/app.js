var password = require("../password"),
    Sequelize = require("sequelize"),
    sequelize = new Sequelize("sequelize-learning-01", "dev", password,
        {
            dialect: "mysql",
            port: 3306
        });

var User = sequelize.define("User",
                            {
                                userId: {
                                    type: Sequelize.INTEGER,
                                    primaryKey: true,
                                    autoIncrement: true
                                },
                                userName: Sequelize.STRING,
                                email: Sequelize.STRING
                            },
                            {
                                timestamps: false
                            });

var users = [];
var tasks = [];

var Task = sequelize.define("Task",
                            {
                                taskId: {
                                    type: Sequelize.INTEGER,
                                    primaryKey: true,
                                    autoIncrement: true
                                },
                                userId: {
                                    type: Sequelize.INTEGER,
                                    references: User,
                                    referencesKey: "userId"
                                },
                                taskName: Sequelize.STRING
                            },
                            {
                                timestamps: false
                            });

sequelize
    .authenticate()
    .complete(function(err)
        {
            if (err)
            {
                console.log("Error authenticating with database: " + err);
            }
            else
            {
                console.log("Connection established.");
                continueAfterAuthentication();
            }
        });

function continueAfterAuthentication()
{
    sequelize.sync({force: true}).complete(function(err)
    {
        if (err)
        {
            console.log("Error syncing database: " + err);
        }
        else
        {
            console.log("Database sync successful.");
            createUser();
        }
    })
}

function createUser()
{
    var user = User.build({userName: "Sam", email: "sam@gmail.com"});
    user.save().complete(function(err)
    {
        if (err)
        {
            console.log("Error creating user: " + err);
        }
        else
        {
            console.log("User saved");
            console.log(user);
            console.log(JSON.stringify(user));

            createUsers();
        }
    })
}

function createUsers()
{
    for (var i=0; i<1000; i++)
    {
        User.create({userName: "User" + i, email: "user" + i + "@gmail.com"}).complete(function(err, user)
        {
            if (err)
            {
                console.log("Error creating user: " + err);
            }
            else
            {
                users.push(user);

                if (users.length == 1000)
                {
                    searchForUsers();
                }
            }
        })
    }
}

function searchForUsers()
{
    User.findAll({where: {userId: {gt: 100, lt: 200}}}).complete(function(err, users)
    {
       if (err)
       {
           console.log("Error in find: " + err);
       }
       else
       {
           console.log("Found " + users.length + " users");
           console.log([users[0].userName, users[1].userName, users[2].userName].join(", ") + "...");

           checkSqlSafety();
       }
    });
}

function checkSqlSafety()
{
    User.find({where: {userName: "Testing' drop table users; '"}}).complete(function(err, user) {
        if (err)
        {
            console.log("Error with sql safety check: " + err);
        }
        else
        {
            console.log("Finished with sql safety call. User: ");
            console.log(user);

            createTasks();
        }
    })
}

function createTasks()
{
    console.log("Creating tasks for users.");

    for(var ui = 0; ui < 5; ui++)
    {
        var user = users[ui];

        for(var ti = 0; ti < 10; ti++)
        {
            var task = Task.create({userId: user.userId, taskName: "Task " + ti + " for user " + user.userName})
                           .complete(function(err, task)
            {
                if (err)
                {
                    console.log("Error creating task: " + err);
                }
                else
                {
                    tasks.push(task);

                    if (tasks.length == 50)
                    {
                        console.log("Created all 50 tasks.");
                        queryUsersWithTasks();
                    }
                }
            })
        }
    }
}

function queryUsersWithTasks()
{
    
}