/// <reference path="../node.d.ts" />

/*************************************
 *
 * Code below would be generated
 *
 */
interface Sequelize
{
    (database: string, user: string, password: string, options: any);

    define(table: string, fields: Object, options?: Object);

    authenticate():Promise<any>;
    sync(options: Object):Promise<any>;

    query(sql: string):Promise<any>;
}

interface Promise<T>
{
    complete(callback: (err: Error) => void):void;
    complete(callback: (err: Error, t:T) => void):void;
    complete(callback: (err: Error, ts:Array<T>) => void):void;

    then(method: () => void):Promise<T>;
}

interface Entity<T>
{
    save?():Promise<T>;
}

interface StaticEntity<T>
{
    build(t: T):T;
    create(t: T):Promise<T>;
}

interface Client extends Entity<User>
{
    clientId?: number;
    clientName?: string;
}

interface ClientWhere
{
    clientId?: any;
    clientName?: any;
}

interface ClientStatic extends StaticEntity<Client>
{
    find(where?: ClientWhere):Promise<Client>;
    findAll(where?: ClientWhere):Promise<Client>;
}

interface User extends Entity<User>
{
    userId?: number;
    clientId?: number;
    userName: string;
    email: string;
}

interface UserStatic extends StaticEntity<User>
{
    find(where?: UserWhere):Promise<User>;
    findAll(where?: UserWhere):Promise<User>;
}

interface UserWhere
{
    userId?: any;
    userName?: any;
    email?: any;
}

interface Task extends Entity<Task>
{
    taskId?: number;
    userId: number;
    taskName: string;
}

interface TaskWhere
{
    taskId?: any;
    userId?: any;
    taskName?: any;
}

interface TaskStatic extends StaticEntity<Task>
{
    find(where?: TaskWhere):Promise<Task>;
    findAll(where?: TaskWhere):Promise<Task>;
}
var password:string = require("../password");
var Sequelize = require("sequelize");

/****************************
 *
 * End generated code
 */



/**********************
 *
 * Security hook
 *
 */


var currentUserClientID:number = 1;

var p = Sequelize.Model.prototype;
p._orig_findAll = p.findAll;
p.findAll = function(options, queryOptions)
{
    var createdWhere:boolean = false;

    if (options == undefined)
    {
        options = {};
    }

    if (options.where == undefined)
    {
        options.where = {};
        createdWhere = true;
    }

    var where = options.where;

    // are we already filtering by clientId
    // or have a field for clientId
    if (where.clientId !== undefined ||
        this.rawAttributes.clientId !== undefined)
    {
        console.log(this.tableName + ".findAll() -> Filtering directly for client.")
        where.clientId = currentUserClientID;
    }

    /********************
     *
     * Need to auto-generate some schema info model so we can look up
     * associations between all tables to the root secured table, but for this test
     * we only have Tasks that maps to Users which map to Clients.
     * 
     */
    else if (this.rawAttributes.userId !== undefined)
    {
        console.log(this.tableName + ".findAll() -> Filtering for client via users.");

        var filter:string = this.tableName + ".userId IN (SELECT userId FROM users WHERE clientId = " + currentUserClientID + ")"

        options.where = createdWhere
                            ? filter
                            : [filter, where];
    }

    return this._orig_findAll(options, queryOptions);
};


/*****************************
 *
 * Here's the app...
 */
var sequelize:Sequelize = new Sequelize("sequelize-learning-01", "dev", password,
    {
        dialect: "mysql",
        port: 3306,
        timestamps: false
    });

var Client:ClientStatic = sequelize.define("Client",
    {
        clientId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        clientName: Sequelize.STRING
    });
var User:UserStatic = sequelize.define("User",
    {
        userId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        clientId: {
            type: Sequelize.INTEGER,
            references: Client,
            referencesKey: "clientId"
        },
        userName: Sequelize.STRING,
        email: Sequelize.STRING
    });

var Task:TaskStatic = sequelize.define("Task",
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
    });



var users:Array<User> = [];
var tasks:Array<Task> = [];
var clients:Array<Client> = [];

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
    sequelize
        .query("SET FOREIGN_KEY_CHECKS = 0")
        .then(function() { return sequelize.sync({force: true}) })
        .then(function() { sequelize.query("SET FOREIGN_KEY_CHECKS = 1")})
        .then(createClients);
}

function createClients()
{
    for(var i:number = 0; i<5; i++)
    {
        Client.create({clientName: "Client" + i}).complete(function(err, client:Client)
        {
            if (err)
            {
                console.log("Error creating client: " + err);
            }
            else
            {
                clients.push(client);

                if (clients.length == 5)
                {
                    createUser();
                }
            }
        })
    }
}
function createUser()
{
    var user:User = User.build({clientId: clients[0].clientId, userName: "Sam", email: "sam@gmail.com"});
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
    for (var i:number =0; i<1000; i++)
    {
        User.create({clientId: clients[i % 5].clientId, userName: "User" + i, email: "user" + i + "@gmail.com"}).complete(function(err, user:User)
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
    User.findAll({where: {userId: {gt: 100, lt: 200}}}).complete(function(err, users:Array<User>)
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
    User.find({where: {userName: "Testing' drop table users; '"}}).complete(function(err, user:User) {
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
        var user:User = users[ui];

        for(var ti = 0; ti < 10; ti++)
        {
            Task.create({userId: user.userId, taskName: "Task " + ti + " for user " + user.userName})
                .complete(function(err, task:Task)
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
                            queryTasks();
                        }
                    }
                })
        }
    }
}

function queryTasks()
{
    Task.findAll().complete(function(err, tasks:Array<Task>)
    {
        if (err)
        {
            console.log("Error querying tasks: " + err);
        }
        else
        {
            console.log("Found " + tasks.length + " tasks.");
            for(var i:number = 0; i<tasks.length; i++)
            {
                var task:Task = tasks[i];
                console.log("    Task " + task.taskName + " for User " + task.userId);
            }

            queryTasks2();
        }
    })
}

function queryTasks2()
{
    Task.findAll({where: {taskId: {between: [0, 5]}}}).complete(function(err, tasks:Array<Task>)
    {
        if (err)
        {
            console.log("Error querying tasks: " + err);
        }
        else
        {
            console.log("Found " + tasks.length + " tasks.");
            for(var i:number = 0; i<tasks.length; i++)
            {
                var task:Task = tasks[i];
                console.log("    Task " + task.taskName + " for User " + task.userId);
            }
        }
    })
}



