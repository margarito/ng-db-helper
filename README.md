# NgDbHelperModule

> This module is an ORM with plugable connector to share model and logic on multiple environnement.

See [Usage documentation](https://github.com/margarito/ng-db-helper/blob/master/index.md)

See [complete api documentation](http://htmlpreview.github.io/?https://raw.githubusercontent.com/margarito/ng-db-helper/master/documentation/index.html)

This module simplify persistence with relationnal databases.
As there is many platforms or devices, this module bring possibility to manage connectors.
It allows integrators to have a better code portability.

It can be used with cordova-sqlite-storage, websql or other relationnal database if you
implement your own connector.

See example project: [Todos App](https://github.com/margarito/todos-app)

See examples of code below,

Déclaration:

```typescript

@Table({name: 'todos'})
export class Todo extends DbHelperModel {

  @PrimaryKey({autoIncremented: true})
  public id: number;

  @Column()
  public name: string;

  @Column(type: 'number')
  public dueDate: number;

  @Column(type: 'boolean')
  public isDone: boolean;

  @ForeignModel(Category)
  public category: Category;
}

```

Use in a component:

```typescript

@Component({
  selector: 'mgto-todos',
  template: '',
  styles: ''
})
class TodosPage implements OnInit {
  public todoQueryResult: QueryResult<Todo>;

  public ngOnInit() {
    // retrieve not done and not passed todos, you may put this in a service
    Select(Todo).where({isDone: false, and__dueDate__lt: (new Date()).getTime()}).exec()
      .subscribe((qr: QueryResult<Todo>) => {
        this.todoQueryResult = qr;
      }, (err) => {
        // manage error
      });
  }

  public checkTodo(todo: Todo) {
    todo.isDone = !todo.isDone;
    todo.save().subscribe(() => {
      // isDone did change and is saved
    }, (err) => {
      // manage error
      // cancel done change
      todo.isDone = !todo.isDone;
    });
  }
}

```

## Prerequisites

Your application must be an angular project. Then choose the kind of database supported
by the target device of your app. This module support can be configured to support Websql
or cordova-sqlite-storage or both on specific conditions.

If you have other need and this need is to use a relationnal database, see the connector
API and you will be able to build your own connector and keep using this API design.

## Installing

This module is available on official npm registry, with command line from your project,
use the command below:

```shell

npm install ng-db-helper --save

```

The module is now a part of your dependancies and is ready to be used. See Usage to learn
about how easy it is !

## Done and Todos

  Contact me to suggest missing things on this todo list!

- [ ] Queries
  - [x] select
  - [x] insert
  - [x] update
  - [x] delete
  - [ ] Manage join tables
  - [x] Sub queries management to clauses
  - [x] Sub clause group
  - [x] Composite clause to compaire tuple of column with tuple of values
  - [x] Allow semantic clause complexity
  - [x] Batch queries
- [ ] Models
  - [x] Table annotation
  - [x] Column annotation
  - [x] Foreign models
  - [ ] Add foreign delete constraint
  - [ ] Many to many link
  - [ ] Manage more types like Date
  - [ ] add formatter functions
  - [ ] constraint management
  - [ ] Create a base service with usefull generic functions
  - [ ] Observe model change
- [ ] Connectors
  - [x] standard interface
  - [x] plugable connector on init config
  - [x] cordova-sqlite-storage connector
  - [x] Websql connector
  - [x] Hybrid connector detecting cordova-sqlite-storage or Websql connector support and activate it
  - [x] Batch queries
  - [ ] Default connector configuration
- [ ] Design
  - [ ] Pass some possible values for field to enum

## Authors

- Olivier Margarit

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.