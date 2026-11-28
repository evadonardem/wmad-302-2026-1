import { Redirect } from 'expo-router';
import { routes } from '@/utils/routes';

export default function IndexRoute() {
  return <Redirect href={routes.home} />;
}
