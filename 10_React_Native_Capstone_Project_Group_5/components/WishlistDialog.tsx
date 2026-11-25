/**
 * WishlistDialog - the saved-items list opened from the profile
 * Shows each saved product with its price, lets you add it to the cart, open it, or remove it.
 */
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Dialog, IconButton, List, Portal } from 'react-native-paper';
import { useCart } from '@/context/CartContext';
import { WishItem, useWishlist } from '@/context/WishlistContext';
import { palette, radius, spacing, themed } from '@/constants/theme';

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
        });
        onMessage('Added to cart');
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onClose}>
                <Dialog.Title>Wishlist ({items.length})</Dialog.Title>
                <Dialog.ScrollArea>
                    <ScrollView style={{ maxHeight: 420 }}>
                        {items.length === 0 ? (
                            <Text style={styles.empty}>Nothing saved yet. Tap the heart on a product to keep it here.</Text>
                        ) : (
                            items.map((item) => (
                                <List.Item
                                    key={item.productId}
                                    title={item.title}
                                    titleNumberOfLines={2}
                                    description={`$${salePrice(item).toFixed(2)}${item.discountPercentage > 0 ? `  ·  was $${item.price.toFixed(2)}` : ''}`}
                                    left={() => (
                                        <View style={styles.thumb}>
                                            <Image source={{ uri: item.thumbnail }} style={styles.thumbImage} resizeMode="contain" />
                                        </View>
                                    )}
                                    right={() => (
                                        <View style={styles.actions}>
                                            <IconButton icon="cart-plus" size={20} onPress={() => addToCart(item)} accessibilityLabel="Add to cart" />
                                            <IconButton icon="heart-remove-outline" size={20} onPress={() => remove(item.productId)} accessibilityLabel="Remove from wishlist" />
                                        </View>
                                    )}
                                    onPress={() => {
                                        onClose();
                                        onOpenProduct(item.productId);
                                    }}
                                />
                            ))
                        )}
                    </ScrollView>
                </Dialog.ScrollArea>
                <Dialog.Actions>
                    {items.length > 0 && <Button onPress={clear}>Clear all</Button>}
                    <Button onPress={onClose}>Close</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = themed(() =>
    StyleSheet.create({
        empty: { paddingVertical: spacing.lg, textAlign: 'center', color: palette.stone },
        actions: { flexDirection: 'row', alignItems: 'center' },
        thumb: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: palette.sand, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginRight: 4 },
        thumbImage: { width: '80%', height: '80%' },
    })
);