# Update

Update is an helper to update a single model:

```typescript

Update(todo).exec().subscribe(...);

```

but you should prefer use `todo.save()`;

Otherwise it could be used to update multiple entries in one query:

```typescript

// set done on all passed todos
const dueDatePassedClause = new Clause();
dueDatePassedClause.key = 'dueDate';
dueDatePassedClause.value = (new Date()).getTime();
dueDatePassedClause.comparator = Clause.COMPARATORS.LTE
Update(Todo).set({isDone: true}).where(dueDatePassedClause).exec().subscribe(...);

// alternativelly you could do undone task in one week
Update(Todo)
  .set({dueDate: onWeekLaterDate.getTime()})
  .where(dueDatePassedClause).where({isDone: false})
  .exec().subscribe(...);

```