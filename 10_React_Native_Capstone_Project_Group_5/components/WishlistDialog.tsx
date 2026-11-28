/**
 * WishlistDialog - the saved-items list opened from the profile
 * Each saved product is a soft card with its price, a discount tag, an add-to-cart
 * shortcut and a remove button. Wrapped in the shared AppDialog shell.
 */
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { useCart } from '@/context/CartContext';
import { WishItem, useWishlist } from '@/context/WishlistContext';
import { palette, radius, themed } from '@/constants/theme';
import { AppDialog, DialogEmptyState, DialogRow } from '@/components/AppDialog';
import { LuckySpinWheel } from '@/components/LuckySpinWheel';

interface WishlistDialogProps {
    visible: boolean;
    onClose: () => void;
    onOpenProduct: (id: number) => void;
    onMessage: (text: string) => void;
}

const salePrice = (i: WishItem): number => i.price * (1 - i.discountPercentage / 100);

export function WishlistDialog({ visible, onClose, onOpenProduct, onMessage }: WishlistDialogProps) {
    const { items, remove, clear } = useWishlist();
    const { addItem, items: cartItems } = useCart();
    const [spinOpen, setSpinOpen] = useState(false);

    const addToCart = (item: WishItem) => {
        const inCart = cartItems.find((c) => c.productId === item.productId)?.quantity ?? 0;
        if (item.stock <= 0 || inCart >= item.stock) {
            onMessage(item.stock <= 0 ? 'This item is out of stock' : 'You already have the maximum in your cart');
            return;
        }
        addItem({
            productId: item.productId,
            title: item.title,
            thumbnail: item.thumbnail,
            price: item.price,
            discountPercentage: item.discountPercentage,
            quantity: 1,
            stock: item.stock,
            category: item.category,
            brand: item.brand,
            tags: item.tags,
        });
        onMessage('Added to cart');
    };

    const openProduct = (item: WishItem) => {
        onClose();
        onOpenProduct(item.productId);
    };

    return (
        <>
        <AppDialog
            visible={visible}
            onDismiss={onClose}
            icon="heart-outline"
            eyebrow="Saved for later"
            title="Wishlist"
            subtitle={
                items.length === 0
                    ? 'Keep an eye on the pieces you love'
                    : `${items.length} ${items.length === 1 ? 'piece' : 'pieces'} waiting for you`
            }
            actions={[
                ...(items.length > 1 ? [{ label: 'Spin Pick', icon: 'ferris-wheel' as const, mode: 'contained' as const, onPress: () => setSpinOpen(true) }] : []),
                ...(items.length > 0 ? [{ label: 'Clear all', onPress: clear, tone: 'danger' as const }] : []),
                { label: 'Done', onPress: onClose },
            ]}
            footerNote={items.length > 0 ? 'Tap a product to open it, or add it straight to your cart.' : undefined}
        >
            {items.length === 0 ? (
                <DialogEmptyState
                    icon="heart-outline"
                    title="Nothing saved yet"
                    message="Tap the heart on any product and it will be kept here for later."
                />
            ) : (
                items.map((item) => {
                    const price = salePrice(item);
                    const outOfStock = item.stock <= 0;
                    return (
                        <DialogRow
                            key={item.productId}
                            image={item.thumbnail}
                            title={item.title}
                            subtitle={outOfStock ? 'Out of stock' : `${item.stock} in stock`}
                            meta={`$${price.toFixed(2)}${item.discountPercentage > 0 ? `  ·  was $${item.price.toFixed(2)}` : ''}`}
                            badge={item.discountPercentage > 0 ? `-${Math.round(item.discountPercentage)}%` : undefined}
                            onPress={() => openProduct(item)}
                            actions={
                                <IconButton
                                    icon="heart-remove-outline"
                                    size={20}
                                    iconColor={palette.danger}
                                    onPress={() => {
                                        remove(item.productId);
                                        onMessage('Removed from wishlist');
                                    }}
                                    accessibilityLabel="Remove from wishlist"
                                />
                            }
                            footer={
                                <Button
                                    mode="contained-tonal"
                                    icon="cart-plus"
                                    compact
                                    disabled={outOfStock}
                                    onPress={() => addToCart(item)}
                                    style={styles.addButton}
                                    labelStyle={styles.addButtonLabel}
                                >
                                    {outOfStock ? 'Out of stock' : 'Add to cart'}
                                </Button>
                            }
                        />
                    );
                })
            )}
        </AppDialog>
        <LuckySpinWheel
            visible={spinOpen}
            title="Spin Your Wishlist!"
            items={items.map((i) => ({ id: i.productId, label: i.title, image: i.thumbnail, subtitle: `$${salePrice(i).toFixed(2)}` }))}
            onClose={() => setSpinOpen(false)}
            onPick={(picked) => onMessage(`Lucky pick: ${picked.label}`)}
        />
        </>
    );
}

const styles = themed(() =>
    StyleSheet.create({
        addButton: { borderRadius: radius.pill, alignSelf: 'flex-start' },
        addButtonLabel: { fontSize: 11, fontWeight: '700' },
    })
);
