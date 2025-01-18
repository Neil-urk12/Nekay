# Schema Information

## Tables

### Tasks
- **id**: String (Primary Key)
- **taskContent**: String
- **completed**: Boolean
- **folderId**: String
- **syncStatus**: String ("synced" | "pending" | "failed")
- **lastModified**: Number
- **timestamp**: Number

### Journal Entries
- **id**: String (Primary Key)
- **title**: String
- **content**: String
- **status**: String ("deleted" | "archived" | "active")
- **date**: String
- **folderId**: String
- **syncStatus**: String ("synced" | "pending" | "failed")
- **lastModified**: Number
- **timestamp**: Number

### Folders
- **id**: String (Primary Key)
- **name**: String
- **type**: String ("task" | "journal" | "allTasks")
- **syncStatus**: String ("synced" | "pending" | "failed")
- **numOfItems**: Number
- **lastModified**: Number
- **timestamp**: Number

### Notes
- **id**: String (Primary Key)
- **noteTitle**: String
- **noteContent**: String
- **syncStatus**: String ("synced" | "pending" | "failed")
- **timestamp**: Number
- **lastModified**: Number

### Pomodoro Sessions
- **id**: String (Primary Key)
- **type**: String ("work" | "break")
- **syncStatus**: String ("synced" | "pending" | "failed")
- **startTime**: Number
- **timestamp**: Number
- **lastModified**: Number

### Water Entries
- **id**: String (Primary Key)
- **amount**: Number
- **date**: String
- **timestamp**: Number
- **syncStatus**: String ("synced" | "pending" | "failed")
- **lastModified**: Number

## Indexes

### Tasks
- **syncStatus+lastModified**: Compound Index

### Journal Entries
- **syncStatus+lastModified**: Compound Index

### Folders
- **syncStatus+lastModified**: Compound Index

### Notes
- **syncStatus+lastModified**: Compound Index

### Pomodoro Sessions
- **syncStatus+lastModified**: Compound Index

### Water Entries
- **syncStatus+lastModified**: Compound Index

## Relationships

### Tasks to Folders
- **folderId** in Tasks references **id** in Folders

### Journal Entries to Folders
- **folderId** in Journal Entries references **id** in Folders

## Sync Status
- **syncStatus**: Indicates the synchronization status of the item with the remote database.
  - **synced**: The item is synchronized with the remote database.
  - **pending**: The item is pending synchronization with the remote database.
  - **failed**: The synchronization of the item with the remote database has failed.

## Timestamps
- **timestamp**: The creation timestamp of the item.
- **lastModified**: The last modification timestamp of the item.

## Additional Notes
- The schema is designed to support offline-first functionality, allowing users to create, read, update, and delete items even when offline.
- Synchronization with the remote database is handled automatically when the user is online.
