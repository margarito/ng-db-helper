# RawQuery

RawQuery allow integrators to start unmanaged queries but it is strongly deprecated
to use it only this API. This could totally suppress the interest of using this module.

```typescript

// Select des todo dont l'état done est défini dans la table config
// Les requête imbriqué n'étant pas encore géré, on peut imaginer une requête
// de ce type
RawQuery('SELECT * FROM Todo WHERE isDone =' +
  '(SELECT value FROM Config WHERE name = (?))',
  ['defaultDoneState'], // params of the query
  50, // page size of the query
  0);

```

It's planed to manage complex query soon, be carefull about updates to benefit 
optimizations and code lisibility.