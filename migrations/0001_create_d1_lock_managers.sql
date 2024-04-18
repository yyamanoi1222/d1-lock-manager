-- Migration number: 0001 	 2024-04-18T00:15:12.133Z

create table lock_managers (
  id integer not null primary key autoincrement,
  key varchar(20) not null unique,
  expired_at int not null
);
