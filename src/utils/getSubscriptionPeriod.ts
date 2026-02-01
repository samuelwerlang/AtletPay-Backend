async function getSubscriptionPeriod(sub: any) {
  const startSec =
    sub.current_period_start ?? sub.items?.data?.[0]?.current_period_start;
  const endSec =
    sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return {
    currentPeriodStart: startSec ? new Date(startSec * 1000) : new Date(),
    currentPeriodEnd: endSec ? new Date(endSec * 1000) : new Date(),
  };
}

export { getSubscriptionPeriod };
