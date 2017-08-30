# Delete

Delete is an helper to delete a single model:

```typescript

Update(todo).exec().subscribe(...);

```

but you should prefer use `todo.delete()`;

Otherwise it could be used to delete multiple entries in one query:

```typescript

// delete done todos
Delete(Todo).where({isDone: true}).exec().subscribe(...);

// delete all todos
Delete(Todo).exec().subscribe(...);

```