-- migrate:up
create TABLE templates (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY NOT NULL,
    version_id integer,
    name text,
    temp_link text,
    temp_etag text,
    created_at timestamp(0) default now() not null,
    updated_at timestamp(0) default now() not null,
    deleted_at timestamp(0)
);

create TABLE versions (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY NOT NULL,
    template_id integer references public.templates (id),
    version integer,
    version_link text,
    version_etag text,
    created_at timestamp(0) default now() not null,
    updated_at timestamp(0) default now() not null,
    deleted_at timestamp(0)
);
-- migrate:down

