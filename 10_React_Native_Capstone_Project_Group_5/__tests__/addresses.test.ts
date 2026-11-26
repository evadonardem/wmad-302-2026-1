import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatAddress, loadAddresses, saveAddresses } from '@/services/addresses';

describe('addresses service', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('formats address', () => {
    expect(
      formatAddress({
        id: '1',
        label: 'Home',
        fullName: 'A B',
        phone: '12345678',
        street: '123 St',
        city: 'City',
        region: 'Region',
        postalCode: '1000',
        isDefault: true,
      })
    ).toBe('123 St, City, Region 1000');
  });

  it('saves and loads addresses', async () => {
    const addresses = [
      {
        id: '1',
        label: 'Home' as const,
        fullName: 'A B',
        phone: '12345678',
        street: '123 St',
        city: 'City',
        region: 'Region',
        postalCode: '1000',
        isDefault: true,
      },
    ];
    await saveAddresses(1, addresses);
    await expect(loadAddresses(1)).resolves.toEqual(addresses);
    await expect(loadAddresses(2)).resolves.toEqual([]);
  });
});
