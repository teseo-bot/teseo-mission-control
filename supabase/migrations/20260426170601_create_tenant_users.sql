CREATE TABLE public.tenant_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, user_id)
);

ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read tenant users" ON public.tenant_users
FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.tenant_users tu 
        WHERE tu.tenant_id = tenant_users.tenant_id 
          AND tu.user_id = auth.uid()
    )
);

CREATE POLICY "Allow OWNER/ADMIN to modify" ON public.tenant_users
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.tenant_users tu 
        WHERE tu.tenant_id = tenant_users.tenant_id 
          AND tu.user_id = auth.uid()
          AND tu.role IN ('OWNER', 'ADMIN')
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tenant_users tu 
        WHERE tu.tenant_id = tenant_users.tenant_id 
          AND tu.user_id = auth.uid()
          AND tu.role IN ('OWNER', 'ADMIN')
    )
);
