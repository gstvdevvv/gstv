-- FINANCEIRO — schema inicial (rodar 1x no SQL Editor do Supabase)

create extension if not exists "pgcrypto";

create table households (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

create table usuarios_household (
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  papel text not null default 'membro' check (papel in ('admin','membro')),
  primary key (user_id, household_id)
);

create table categorias (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  tipo text not null check (tipo in ('receita','fixa','variavel','investimento')),
  nome text not null,
  cor text,
  icone text,
  limite_padrao numeric,
  created_at timestamptz not null default now()
);

create table cartoes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  nome text not null,
  bandeira text,
  limite numeric,
  dia_fechamento int,
  dia_vencimento int,
  created_at timestamptz not null default now()
);

create table lancamentos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  categoria_id uuid references categorias(id) on delete set null,
  tipo text not null check (tipo in ('receita','despesa')),
  descricao text not null,
  valor_previsto numeric,
  valor_realizado numeric,
  data date not null default current_date,
  mes_ref text not null,
  forma_pagamento text,
  cartao_id uuid references cartoes(id) on delete set null,
  recorrente boolean not null default false,
  created_at timestamptz not null default now()
);
create index lancamentos_household_mes_idx on lancamentos(household_id, mes_ref);

create table gastos_cartao (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  cartao_id uuid not null references cartoes(id) on delete cascade,
  descricao text not null,
  categoria_id uuid references categorias(id) on delete set null,
  valor_total numeric not null,
  parcelas int not null default 1,
  parcela_atual int not null default 1,
  data_compra date not null default current_date,
  fatura_mes_ref text not null,
  created_at timestamptz not null default now()
);
create index gastos_cartao_household_fatura_idx on gastos_cartao(household_id, fatura_mes_ref);

create table dividas (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  credor text not null,
  valor_total numeric not null,
  negociacao_texto text,
  parcelas_qtd int,
  valor_parcela numeric,
  data_primeira_parcela date,
  status text not null default 'ativa' check (status in ('ativa','negociando','paga')),
  created_at timestamptz not null default now()
);

create table pagamentos_divida (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  divida_id uuid not null references dividas(id) on delete cascade,
  valor numeric not null,
  data date not null default current_date,
  mes_ref text not null,
  created_at timestamptz not null default now()
);
create index pagamentos_divida_divida_idx on pagamentos_divida(divida_id);

create table investimentos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  ativo_destino text not null,
  mes_ref text not null,
  valor_planejado numeric,
  valor_aportado numeric,
  created_at timestamptz not null default now()
);
create index investimentos_household_mes_idx on investimentos(household_id, mes_ref);

create table config (
  household_id uuid primary key references households(id) on delete cascade,
  meta_poupanca_pct numeric not null default 20,
  alerta_limite_pct numeric not null default 90,
  meses_reserva_meta numeric not null default 6
);

-- helper: usuario autenticado pertence ao household?
create or replace function is_household_member(hid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from usuarios_household
    where household_id = hid and user_id = auth.uid()
  );
$$;

alter table households enable row level security;
alter table usuarios_household enable row level security;
alter table categorias enable row level security;
alter table cartoes enable row level security;
alter table lancamentos enable row level security;
alter table gastos_cartao enable row level security;
alter table dividas enable row level security;
alter table pagamentos_divida enable row level security;
alter table investimentos enable row level security;
alter table config enable row level security;

create policy households_select on households for select using (is_household_member(id));
create policy households_update on households for update using (is_household_member(id));

create policy usuarios_household_select on usuarios_household for select using (
  user_id = auth.uid() or is_household_member(household_id)
);

create policy categorias_all on categorias for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy cartoes_all on cartoes for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy lancamentos_all on lancamentos for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy gastos_cartao_all on gastos_cartao for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy dividas_all on dividas for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy pagamentos_divida_all on pagamentos_divida for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy investimentos_all on investimentos for all using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy config_all on config for all using (is_household_member(household_id)) with check (is_household_member(household_id));

-- SETUP MANUAL (rodar depois de criar os usuarios no Authentication > Users):
-- 1) insert into households (nome) values ('Familia') returning id;
-- 2) insert into usuarios_household (user_id, household_id, papel) values ('<uid-gustavo>', '<household-id>', 'admin');
-- 3) insert into usuarios_household (user_id, household_id, papel) values ('<uid-vitoria>', '<household-id>', 'admin');
-- 4) insert into config (household_id) values ('<household-id>');

-- CATEGORIAS PADRAO (rodar apos ter o household-id)
-- insert into categorias (household_id, tipo, nome) values
--  ('<household-id>','receita','Salario Gustavo'),
--  ('<household-id>','receita','Salario Vitoria'),
--  ('<household-id>','receita','Freelance / Bico'),
--  ('<household-id>','receita','Renda Extra / Bonus'),
--  ('<household-id>','receita','Dividendos / Investimentos'),
--  ('<household-id>','receita','Aluguel Recebido'),
--  ('<household-id>','receita','Beneficios / Reembolsos'),
--  ('<household-id>','receita','Outras Receitas'),
--  ('<household-id>','fixa','Aluguel / Financiamento'),
--  ('<household-id>','fixa','Condominio'),
--  ('<household-id>','fixa','Financiamento Carro'),
--  ('<household-id>','fixa','Energia Eletrica'),
--  ('<household-id>','fixa','Internet / TV / Telefone'),
--  ('<household-id>','fixa','MEI'),
--  ('<household-id>','fixa','Seguro'),
--  ('<household-id>','fixa','Escola / Faculdade'),
--  ('<household-id>','fixa','Academia'),
--  ('<household-id>','fixa','Empregada / Diarista'),
--  ('<household-id>','fixa','Outras Fixas'),
--  ('<household-id>','variavel','Alimentacao / Supermercado'),
--  ('<household-id>','variavel','Cartao de Credito'),
--  ('<household-id>','variavel','Transporte / Combustivel'),
--  ('<household-id>','variavel','Pet'),
--  ('<household-id>','variavel','Farmacia / Saude'),
--  ('<household-id>','variavel','Roupas / Calcados'),
--  ('<household-id>','variavel','Lazer / Entretenimento'),
--  ('<household-id>','variavel','Educacao / Cursos'),
--  ('<household-id>','variavel','Cuidados Pessoais'),
--  ('<household-id>','variavel','Presentes / Outros'),
--  ('<household-id>','investimento','Reserva de Emergencia'),
--  ('<household-id>','investimento','Tesouro Direto / CDB'),
--  ('<household-id>','investimento','Compra Terreno'),
--  ('<household-id>','investimento','FIIs'),
--  ('<household-id>','investimento','Previdencia Privada'),
--  ('<household-id>','investimento','Criptoativos'),
--  ('<household-id>','investimento','Outros Investimentos');

-- MIGRACAO: meta de reserva de emergencia (rodar 1x no banco existente)
-- alter table config add column if not exists meses_reserva_meta numeric not null default 6;
