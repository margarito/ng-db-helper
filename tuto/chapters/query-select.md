# Select

Select provide multiple methods returning itself to chain operations et being more semantic.

example:

```typescript

Select(Todo)
  .where({isDone: false})     // set where clauses
  .groupBy('dueDate')         // set group by clause
  .orderBy('createdAt DESC')  // order items on one or many column
  .setSize(100)         // set size, default is 1000, this allow to paginate results
  .setPage(0)           // set page, default is 0, this allow to target specific page
  .projection(['id', 'isDone', 'label', 'dueDate', 'createdAt'])
    // customize projection, this may be use to optimize query on big object
    // but should not be used if not perf problem is detected
  .subscribe(...);

```

`Select(model: {new(): T})` is a templated function, so that the subscribed success method will directly give
you instances of the model

```typescript

Select(Todo).subscribe((qr: QueryResult<Todo>) => {
  if (qr.rows.length) {
    const todo = qr.rows.item(0); // todo item is an instance of Todo without any effort

    // do things with your newly instanciated Todo instance !!
  }
});

```