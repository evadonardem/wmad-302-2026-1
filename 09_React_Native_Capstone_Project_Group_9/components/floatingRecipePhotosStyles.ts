import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  collage: {
    position: 'absolute',
  },
  collageWide: {
    width: 236,
    height: 196,
    top: 12,
    right: 24,
  },
  collageCompact: {
    width: 174,
    height: 68,
    bottom: 8,
    right: 14,
  },
  photo: {
    position: 'absolute',
    width: 112,
    height: 128,
    borderRadius: 17,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#FFF3E0',
    shadowColor: '#3E2723',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  photoOne: {
    top: 0,
    right: 102,
    zIndex: 1,
  },
  photoTwo: {
    top: 34,
    right: 0,
    zIndex: 2,
  },
  photoThree: {
    bottom: 0,
    right: 66,
    zIndex: 3,
  },
  photoOneCompact: {
    width: 58,
    height: 58,
    left: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 3,
  },
  photoTwoCompact: {
    width: 58,
    height: 58,
    left: 56,
    top: 0,
    borderRadius: 12,
    borderWidth: 3,
    zIndex: 2,
  },
  photoThreeCompact: {
    width: 58,
    height: 58,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 3,
    zIndex: 3,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
});

