ALTER TABLE public.agent_usage_balances ALTER COLUMN allowance_usd SET DEFAULT 0;
UPDATE public.agent_usage_balances SET allowance_usd = 0;
CREATE OR REPLACE FUNCTION public.agent_usage_status() RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); p text;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT plan INTO p FROM public.subscriptions WHERE user_id=u AND current_period_end>now();
 RETURN jsonb_build_object('plan',coalesce(p,'free'),'isPaid',coalesce(p IN ('plus','pro','ultra'),false),'allowanceUsd',0,'spentUsd',0,'remainingUsd',0,'stepUsd',0.01,'resetsDaily',false);
END $$;
CREATE OR REPLACE FUNCTION public.charge_agent_usage(p_user_id uuid,p_operation_key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p text;
BEGIN
 IF p_operation_key IS NULL OR length(p_operation_key)<1 OR length(p_operation_key)>200 THEN RAISE EXCEPTION 'Invalid operation'; END IF;
 SELECT plan INTO p FROM public.subscriptions WHERE user_id=p_user_id AND current_period_end>now();
 IF p IN ('plus','pro','ultra') THEN RETURN jsonb_build_object('ok',true,'paid',true,'chargedUsd',0); END IF;
 RETURN jsonb_build_object('ok',false,'code','subscription_required','remainingUsd',0);
END $$;
REVOKE ALL ON FUNCTION public.charge_agent_usage(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.charge_agent_usage(uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.agent_usage_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.agent_usage_status() TO authenticated,service_role;