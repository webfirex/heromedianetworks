import { notifications } from "@mantine/notifications";
import { Image, rem } from "@mantine/core";
import classes from '@/styles/notification.module.css';
import classesx from '@/styles/dashNotification.module.css';

export interface showNotificationProps {
    title: string;
    message: string;
    icon?: string;
    withClose: boolean;
    color?: 'green' | 'red'; // Added color property to fix TypeScript error
}

export const showNotification = ({title, message, icon, withClose} : showNotificationProps) => {
    const notifIcon = <Image src={icon ? icon : '/assests/logoR.png'} alt="icon" style={{ width: rem(40), borderRadius: '100%' }} />

    notifications.show({
        title: title,
        withCloseButton: withClose,
        message: message,
        icon: notifIcon,
        withBorder: true,
        classNames: classes,
        position: 'bottom-right',
        styles: {
            root: {
                background: '#2563eb',
                backgroundColor: '#2563eb',
                color: 'white',
            },
            title: { color: '#2563eb' },
            description: { color: '#2563eb' },
        },
    });
};

export const showDashNotification = ({title, message, icon, withClose} : showNotificationProps) => {
    const notifIcon = <Image src={icon ? icon : '/assests/logoR.png'} alt="icon" style={{ width: rem(40), borderRadius: '100%' }} />

    notifications.show({
        title: title,
        withCloseButton: withClose,
        message: message,
        icon: notifIcon,
        withBorder: true,
        classNames: classesx,
        position: 'bottom-right',
        styles: {
            root: {
                background: '#2563eb',
                backgroundColor: '#2563eb',
                color: 'white',
            },
            title: { color: 'white' },
            description: { color: 'white' },
        },
    });
};