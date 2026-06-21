type ShopifyGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type FulfillmentOrderNode = {
  id: string;
  lineItems: {
    nodes: Array<{
      id: string;
      remainingQuantity: number;
      lineItem?: { id: string } | null;
    }>;
  };
};

function getShopifyAdminConfig() {
  const shopDomain = process.env.SHOPIFY_PROINSPECT_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_PROINSPECT_ADMIN_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_PROINSPECT_ADMIN_API_VERSION || '2025-10';

  if (!shopDomain || !accessToken) return null;

  return {
    shopDomain: shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    accessToken,
    apiVersion
  };
}

export function canUseShopifyAdminApi() {
  return Boolean(getShopifyAdminConfig());
}

async function shopifyGraphql<T>(query: string, variables: Record<string, unknown>) {
  const config = getShopifyAdminConfig();
  if (!config) throw new Error('Shopify Admin API is not configured. Set SHOPIFY_PROINSPECT_SHOP_DOMAIN and SHOPIFY_PROINSPECT_ADMIN_ACCESS_TOKEN.');

  const response = await fetch(`https://${config.shopDomain}/admin/api/${config.apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.accessToken
    },
    body: JSON.stringify({ query, variables })
  });

  const payload = (await response.json()) as ShopifyGraphqlResponse<T>;

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.map((error) => error.message).join('; ') || `Shopify Admin API request failed with status ${response.status}`);
  }

  return payload.data as T;
}

export async function fulfilShopifyAccessControlLineItem(input: {
  shopifyOrderId: string;
  shopifyLineItemId: string;
  jobId: string;
  message?: string;
}) {
  const orderGid = input.shopifyOrderId.startsWith('gid://') ? input.shopifyOrderId : `gid://shopify/Order/${input.shopifyOrderId}`;
  const lineItemGid = input.shopifyLineItemId.startsWith('gid://') ? input.shopifyLineItemId : `gid://shopify/LineItem/${input.shopifyLineItemId}`;

  const data = await shopifyGraphql<{
    order: {
      fulfillmentOrders: { nodes: FulfillmentOrderNode[] };
    } | null;
  }>(
    `query AccessControlFulfillmentOrders($orderId: ID!) {
      order(id: $orderId) {
        fulfillmentOrders(first: 25) {
          nodes {
            id
            lineItems(first: 50) {
              nodes {
                id
                remainingQuantity
                lineItem { id }
              }
            }
          }
        }
      }
    }`,
    { orderId: orderGid }
  );

  const match = data.order?.fulfillmentOrders.nodes.flatMap((fulfillmentOrder) =>
    fulfillmentOrder.lineItems.nodes.map((lineItem) => ({ fulfillmentOrder, lineItem }))
  ).find(({ lineItem }) => lineItem.lineItem?.id === lineItemGid && lineItem.remainingQuantity > 0);

  if (!match) {
    throw new Error(`No open Shopify fulfillment order line item found for Access Control job ${input.jobId}.`);
  }

  const result = await shopifyGraphql<{
    fulfillmentCreate: {
      fulfillment?: { id: string; status: string } | null;
      userErrors: Array<{ field?: string[]; message: string }>;
    };
  }>(
    `mutation AccessControlFulfillmentCreate($fulfillment: FulfillmentInput!, $message: String) {
      fulfillmentCreate(fulfillment: $fulfillment, message: $message) {
        fulfillment { id status }
        userErrors { field message }
      }
    }`,
    {
      message: input.message || `ProInspect Access Control job ${input.jobId} completed.`,
      fulfillment: {
        notifyCustomer: true,
        lineItemsByFulfillmentOrder: [
          {
            fulfillmentOrderId: match.fulfillmentOrder.id,
            fulfillmentOrderLineItems: [
              {
                id: match.lineItem.id,
                quantity: match.lineItem.remainingQuantity
              }
            ]
          }
        ]
      }
    }
  );

  const errors = result.fulfillmentCreate.userErrors;
  if (errors.length) throw new Error(errors.map((error) => error.message).join('; '));
  return result.fulfillmentCreate.fulfillment;
}
