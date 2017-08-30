# Insert

Insert allow single model insertion:

```typescript

Insert(todo).exec().subscribe(...);

```

But prefer use save method on model `todo.save()`.

Insert is a better solution to insert many model, the helper will optimize insertions:

```typescript

Insert(todos).exec().subscribe(...);

```