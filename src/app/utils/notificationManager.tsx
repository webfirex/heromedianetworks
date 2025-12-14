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
                background: 'var(--primary)',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
            },
            title: { color: 'var(--primary-foreground)' },
            description: { color: 'var(--primary-foreground)' },
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
                background: 'var(--primary)',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
            },
            title: { color: 'var(--primary-foreground)' },
            description: { color: 'var(--primary-foreground)' },
        },
    });
};