# Create your models

Model management is based on annotation, the application is designed to prevent declaration
redundancy. Every data model declaration should be done in the main model class file.

This an example of what model declaration could be:

```typescript

import { DbHelperModel } from 'ng-db-helper';
import { Table } from 'ng-db-helper';
import { Column } from 'ng-db-helper';

@Table()
export class Todo extends DbHelperModel {
  @PrimaryKey({autoIncremental: true})
  public id: number;

  @Column()
  public label: string;

  @Column({type: 'boolean'})
  public isDone: boolean;

  @ForeignModel(Category)
  public category: Category
}

```

This is as simple as this example, annotations will be enougth to create your data model in database
and being queriable in your application.

Rules are simple to get the expected result:

- extends DbHelperModel,
- use `@Table` annotation to add your model in the persistence data model,
- use `@PrimaryKey` annotation to easily declare the primary column of your data model,
- use `@Column` annotation to add column definition to the data model,
- use `@ForeignModel` annotation to manage a foreign model with the framework,
- never declare properties named with double underscore ('__'), this could break complex clause sytem.
- never declare properties begining with a double dollar symbol ('$$'), this could collide with private api model variable

## extends DbHelperModel

Model has to extends DbHelperModel to be usable with annotations, implements default model method
and being used with query helpers.

```typescript

// assume that Todo is a model extending DbHelperModel
// this what could look like todo editor
@NgComponent({
  ...
})
class TodoComponent implements OnInit {
  // the todo id injected with an html attribute
  // this is just a pretext to show a query
  @Input()
  public todoId?: number;

  // the todo item edited from the view
  public todo: Todo;

  public ngOnInit() {
    if (this.id) {
      // Select the todo item, it is probably to create a TodoService with a getById
      // method and this is what you could put in there
      Select(Todo).where({id: this.id}).exec().subscribe((qr: QueryResult<Todo>) => {
        if (qr.rows.length) {
          this.todo = qr.rows.item(0);
        } else {
          // item has not be found by id...
        }
      }, (err) => {
        // manage query error
      })
    } else {
      // no id is set, it is probably a creation instance of the component
      this.todo = new Todo();
    }
  }

  // method called on save button clicked
  public onSaveButtonPressed() {
    // call save method
    this.todo.save().subscribe((qr: QueryResult<any>) => {
      // do things after todo is saved
    }, (err) => {
      // manage error
    });
  }

  // method called on delete button clicked
  public onDeleteButtonPressed() {
    // call delete method
    this.todo.delete().subscribe((qr: QueryResult<any>) => {
      // do things after todo is saved
    }, (err) => {
      // manage error
    });
  }
}

  ```

## use `@Table` annotation

Table annotation subscribe your model in the main data model. Then it could be
a part of the model migration to be represented on database and persisted.

you can customize the name of the table and its version. Default name is the
class name and default version is 1.

```typescript

// Table name will be Todo and version will be 1
@Table()
class Todo extends DbHelperModel {
  // declare properties and columns
}

```

```typescript

@Table({
  name: 'Todos' // prefer the table name plural
})
class Todo extends DbHelperModule {
  // declare properties and columns
}

```

## use `@Column` annotation

`@Column` is annotation for model fields to configure database column where the value will be stored. See database standard to clearly understand available column configurations.

annotation signature:

```typescript

/**
 * @function Column decorator to declare property as column of the model
 *
 * @param {ColumnConfig} config the column configurator
 */
Column: (config?: ColumnConfig) => decorator

```

Current available configurator properties :

| config name   |  type   | default value | description                               |
|---------------|:-------:|:-------------:|-------------------------------------------|
| name          | string  | field name    | the column name                           |
| type          | string  | `'string'`    | type of the column, see sqlite types      |
| primaryKey    | boolean | `false`       | flag to set column primary key            |
| autoIncrement | boolean | `false`       | flag to set column value auto incremented |
| unique        | boolean | `false`       | flag to set column value unique           |
| indexed       | boolean | `false`       | flag to set column value indexed          |

And in action:

```typescript

import { DbHelperModel } from 'ng-db-helper';
import { Table } from 'ng-db-helper';
import { Column } from 'ng-db-helper';

@Table()
export class Todo extends DbHelperModel {
  @PrimaryKey({
    autoIncremental: true // no need to set type integer, auto incremental suggest it
  })
  public id: number;

  @Column() // column name will be name, type string...
  public label: string;

  @Column({
    type: 'boolean' // set type boolean
  })
  public isDone: boolean;
}

```

You can now use advanced methods on todos to make reflexive or advanced data modifictaion

```typescript

/**
  * @public
  * @method getColumnValue get a column value by using the column name
  *
  * @param {string} columnName the column name
  *
  * @return {any} the column value stored in database
  */
getColumnValue: (columnName: string) => any

/**
  * @public
  * @method setColumnValue set the column value and bypass the field filter, be carefull before using this method, it can bypass framework
  magic like model change notification.
  *
  * @param {string} columnName   the column to update
  * @param {any} value           the value to set
  *
  * @since 0.2
  */
setColumnValue: (columnName: string, value: any) => void

/**
  * @public
  * @method getFieldValue get the field value by its name
  *
  * @param {string} fieldName the field name from which retrieve the value
  *
  * @return {any} the field value
  */
getFieldValue: (fieldName: string) => any

/**
  * @public
  * @method setFieldValue set the field value by its name
  *
  * @param {string} fieldName    the field to update
  * @param {any} value           the value to set
  */
setFieldValue: (fieldName: string, value: any) => void

```

___
  /!\ TypeScript is a typed language but not JavaScript. Type cannot be read from field
  annotation. You have to declare compatible type between field and database column, if not queries will fail.
___

## use `@PrimaryKey` annotation

This annotation is sugar over `@Column` annotation, it set the annoted property to primary key and make the declaration more readable.

annotation signature:

```typescript

/**
 * @function PrimaryKey decorator to declare property as primary column of the model
 *
 * @param {ColumnConfig} config the column configurator
 */
PrimaryKey: (config?: ColumnConfig) => decorator

```

refer to `@Column` part to get all annotation configuration and capabilities.

## use `@ForeignModel` annotation

The `@ForeignModel` annotation gives access to many relationnal features

annotation signature:

```typescript

/**
 * @function ForeignModel decorator to declare property as column of the model
 *
 * @param {{new(): DbHelperModel}} model  the linked model reference
 * @param {ColumnConfig} config           the column configurator
 * @param {string} key                    the relation key
 */
ForeignModel: (model: {new(): DbHelperModel}, config?: ColumnConfig, key?: string) => decorator

```

see `@Column` part for configurator properties.

If no column name is set in the configurator the name will be computed to be compatible with composite foreign key. The name will be field name appended with the corresponding foreign primary column name begining with an uppercase letter.

For example:

```typescript

@Table({name: 'categories'})
export class Category {
  @PrimaryKey()
  public name: string
}

@Table({name: 'todos'})
export class Todo {
  @PrimaryKey({autoIncrement: true})
  public id: number

  @ForeignModel(Category)
  public category: Category;

  @Column()
  public name: string

  @Column({type: 'boolean'})
  public isDone: boolean;

  @Column({type: 'number'})
  public dueDate: number
}

```

You can build queries the category column name like this:

```typescript

// retrieve all categories
Select(Category).exec().subscribe((qr: QueryResult<Category>) => {
  const names = <string[]>[];
  for (let i = 0; i < qr.rows.length; i++) {
    // collect interesting names categories
    names.push(qr.rows.item(i).name);
  }
  // select not done todos linked to these categories in one query
  Select(Todo).where({isDone: false, and__categoryName__in: names}).exec()
    .subscribe((qr: QueryResult<Todo>) => {
      // do something with this newly retrieved todo list
    }, (err) => {
      console.error(err);
    });
}, (err) => {
  console.error(err);
});

```

## Model lifecycle

Model has a simple lifecycled linked to database management and supported by simple methods:

```typescript

// Create model
const todo = new Todo();
todo.save().subscribe(...);

// Retrieve one model
Select(Todo).where({id: this.id}).setSize(1).exec()
  .subscribe((qr: QueryResult<Todo>) => {
    if (qr.rows.length) {
      this.todo = qr.rows.item(0);
    }
  }, (err) => this.manageError(err));

// Retrieve many model
Select(Todo).exec().subscribe((qr: QueryResult<Todo>) => {
  for (let i = 0; i < qr.rows.length; i++) {
    this.todos.push(qr.rows.item(i));
  }
}, (err) => this.manageError(err));

// Update model, simply save it ! Save do his magic to insert or update entry
this.todo.save().subscribe(...);

// Delete model
this.todo.delete().subscribe(...);

// Retreive Todos linked to Category
Select(Category).where({name__like: 'Work%'}).exec().subscribe((qr: QueryResut<Category>) => {
    // select a specific category of interest named
    let category;
    ... // do your magic to find the good one

    // retrieve linked todos
    category.getLinked(Todo).subscribe((todoQr: QueryResult<Todo>) => {
        const todos = todoQr.rows.toArray();
    });
}, (err) => {
    console.error(err);
});

// Delete multiple todos on an specific clause
Delete(Todo).where({
        isDone: true,
        or__dueDate__lt: (new Date()).getTime(),
        or__categoryName__in: abortedCategoryNames
    })
    .subscribe((qr: QueryResult<any>) => {
        // Delete is done
    }, (err) => {
        console.error(err);
    });

```