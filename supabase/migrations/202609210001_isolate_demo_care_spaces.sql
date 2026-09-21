-- Demo data is a separate, opt-in care space. A person’s account remains the
-- canonical source for their private care records.
alter table public.demo_data_state
  add column if not exists active_mode text not null default 'account'
    check (active_mode in ('account', 'demo')),
  add column if not exists hidden_at timestamptz;

create index if not exists demo_data_state_user_active_idx
  on public.demo_data_state (user_id, active_mode);
