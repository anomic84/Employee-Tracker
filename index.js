const inquirer = require('inquirer');
const mysql = require('mysql2');

require("dotenv").config();

const db = mysql.createConnection(
    {
        host: "localhost",
        user: "root",
        password: process.env.PW,
        database: "employees_db",
    },
    console.log(`Connected to the employees_db database.`)
);

db.connect(function (err) {
    if (err) return console.log(err);
    startingQuestions();
})

// Start of the app that lets user decide what they want to do via prompt
const startingQuestions = () => {
    inquirer.prompt([
        {
            type: 'list',
            name: 'startingquestions',
            message: 'What would you like to do?',
            choices: [
                'View departments',
                'View roles',
                'View employees',
                'Add department',
                'Add role',
                'Add employee',
                'Update employee information'
            ]
        }
    ])
        //Filters the choices to their seperate functions to carry out chosen act
        .then((answers) => {
            switch (answers.startingquestions) {
                case "View departments":
                    viewDepartments();
                    break;
                case 'View roles':
                    viewRoles();
                    break;
                case 'View employees':
                    viewEmployees();
                    break;
                case 'Add department':
                    addDepartment();
                    break;
                case 'Add role':
                    addRole();
                    break;
                case 'Add employee':
                    addEmployee();
                    break;
                case 'Update employee information':
                    updateEmployee();
                    break;
            }
        });
}

const viewDepartments = () => {
    db.query(
        // views name of department as "Departments" for its title from the department db
        "SELECT department.name AS Departments FROM department",
        (err, results) => {
            //console logs a table of the results
            console.table(results);
            //   goes back to start
            startingQuestions();
        }
    );
}

const viewRoles = () => {
    db.query(
        // vies the role table, goes through the role table sub catagories (title and salary) to view. Also, sets the department of roll as "Department" and links keys to department table id
        "SELECT role.title AS Role, role.salary AS Salary, department.name AS Department FROM role JOIN department ON role.department_id = department.id;",
        (err, results) => {
            console.table(results);
            //   goes back to start
            startingQuestions();
        }
    );
}

const viewEmployees = () => {
    db.query("SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, CONCAT(mgr.first_name, mgr.last_name) AS manager FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id LEFT JOIN employee mgr ON employee.manager_id = mgr.id",
        (err, results) => {
            if (err) return console.log(err);
            console.table(results);
            startingQuestions();
        });

}

const addDepartment = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'department',
            message: "Name the department",
        }
    ])
        .then(answer => {
            const mysql = "INSERT INTO department (name) VALUES (?)";
            db.query(mysql, answer.department, (err, results) => {
                if (err) return console.log(err);
                console.log("Added " + answer.department + " to departments");
                viewDepartments();
            })
        })
}

const addRole = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'roles',
            message: "What is the role?",
        },
        {
            type: 'input',
            name: 'salary',
            message: "What is the yearly salary?",
        },

    ])
        .then(answer => {
            // turns results into parameters for later query
            const params = [answer.roles, answer.salary];
            const roleSql = `SELECT name, id FROM department`;
            // fetches, using db constant, a 
            db.query(roleSql, (err, data) => {
                if (err) return console.log(err);
                const department_var = data.map(({ name, id }) => ({ name: name, value: id }));

                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'department_var',
                        message: "What department is this role in?",
                        choices: department_var
                    }
                ])
                    .then(department_varChoice => {
                        const department_var = department_varChoice.department_var;
                        params.push(department_var);
                        const mysql = 'INSERT INTO role (title, salary, department_id) VALUES (?,?,?)'

                        db.query(mysql, params, (err, result) => {
                            if (err) return console.log(err);
                            console.log("Added " + answer.roles + " to roles");
                            viewRoles();
                        });
                    });
            });
        });
};


const addEmployee = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'firstname',
            message: "What is their first name?",
        },
        {
            type: 'input',
            name: 'lastname',
            message: "What is their last name?",
        },
        {
            type: 'input',
            name: 'role',
            message: "What is the role's ID number?",
        },
        {
            type: 'input',
            name: 'manager',
            message: "What is their manader's ID number?",
        },
    ])
        .then(answer => {
            const role = parseInt(answer.role);
            const manager = parseInt(answer.manager)

            db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES(?,?,?,?)', [answer.firstname, answer.lastname, role, manager])
            // {
            //     first_name: answer.firstname,
            //     last_name: answer.lastname,
            //     role_id: answer.role,
            //     manager_id: answer.manager
            // })
            console.log(`${answer.firstname} ${answer.lastname} added to employees.`)
            viewEmployees();
        }

        )
}

function updateEmployee() {
    const employeeSql = `SELECT * FROM employee`;
    db.query(employeeSql, (err, data) => {
        if (err) throw err;
        const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
        inquirer.prompt([
            {
                type: 'list',
                name: 'name',
                message: "Which employee would you like to update?",
                choices: employees
            }
        ])
            .then(empChoice => {
                const employee = empChoice.name; // is the employee wanted for update
                let params = [];
                params.push(employee); // now this equals ["SC"]
                const roleSql = `SELECT * FROM role`;
                db.query(roleSql, (err, data) => {
                    if (err) throw err;
                    const roles = data.map(({ id, title }) => ({ name: title, value: id }));
                    inquirer.prompt([
                        {
                            type: 'list',
                            name: 'role',
                            message: "What is the employee's new role?",
                            choices: roles
                        }
                    ])
                        .then(roleChoice => {
                            const role = roleChoice.role;
                            params.push(role); // ["SC", "Front of House"]
                            let employee = params[0] // employee == "SC"
                            params[0] = role
                            params[1] = employee // now params = ["Front of House", "SC"]
                            const sql = `UPDATE employee SET role_id = ? WHERE id = ?`;
                            db.query(sql, params, (err, result) => {
                                if (err) throw err;
                                console.log("Employee has been updated!");
                                viewEmployees();
                            });
                        });
                });
            });
    });
};
