"use client";
import { useEffect, useState } from 'react';
import { Card, Text, Table, Badge, Group, Skeleton } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { showNotification } from '@/app/utils/notificationManager';
import { IconPhoto, IconGift, IconCoin, IconExternalLink, IconTag } from '@tabler/icons-react';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  offer_name: string;
  price: number;
  currency: string;
  url: string;
  image_url: string;
}

export default function ProductFeedPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let publisher_id = session?.user?.id;
        if (!publisher_id && session?.user?.email) {
          const res = await fetch(`/api/publisher/id?email=${encodeURIComponent(session.user.email)}`);
          if (res.ok) {
            const data = await res.json();
            publisher_id = data.id;
          }
        }
        if (!publisher_id) {
          setError('You must be logged in as a publisher to view the product feed.');
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/offers/product-feed?publisher_id=${publisher_id}`);
        if (!res.ok) throw new Error('Failed to fetch product feed');
        const data = await res.json();
        setProducts(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch product feed';
        setError(msg);
        showNotification({
          title: '⚠️ Error',
          message: msg,
          withClose: false
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [session]);

  if (loading) return (
    <Card shadow="md" radius="md" withBorder>
      <Skeleton height={32} width="40%" mb="md" />
      <Skeleton height={40} width="100%" mb="sm" />
      <Skeleton height={40} width="100%" mb="sm" />
      <Skeleton height={40} width="100%" mb="sm" />
      <Skeleton height={40} width="100%" mb="sm" />
      <Skeleton height={40} width="100%" mb="sm" />
    </Card>
  );
  if (error) return null;

  return (
    <Card shadow="md" radius="md" withBorder>
      {products.length === 0 ? (
        <Text>No products found.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconPhoto size={18} /> Image</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconTag size={18} /> Name</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconGift size={18} /> Offer</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconCoin size={18} /> Price</Group></Table.Th>
              <Table.Th><Group gap={4} style={{ fontSize: 15 }}><IconExternalLink size={18} /> Link</Group></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {products.map((product) => (
              <Table.Tr key={product.id}>
                <Table.Td>
                  <Image src={product.image_url} alt={product.name} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                </Table.Td>
                <Table.Td>
                  <Text fw={500} style={{ fontSize: 16 }}>{product.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color="blue" variant="light" style={{ fontSize: 14 }}>{product.offer_name}</Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color="yellow" variant="light" style={{ fontSize: 14 }}>{product.price} {product.currency}</Badge>
                </Table.Td>
                <Table.Td>
                  {product.url && product.url.startsWith('http') ? (
                    <a href={product.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4169E1', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
                      View <IconExternalLink size={14} />
                    </a>
                  ) : (
                    <span style={{ color: '#aaa', fontSize: 14 }}>N/A</span>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}
