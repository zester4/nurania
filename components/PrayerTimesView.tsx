
import React from 'react';
import { Card } from './common/Card';
import { SkeletonLoader } from './common/SkeletonLoader';
import { QiblaCompass } from './QiblaCompass';
import { useAppContext } from '../contexts/AppContext';

const PrayerTimesView: React.FC = () => {
    const { prayerTimes, qiblaDirection, isLoadingLocationData, locationError } = useAppContext();

    const renderContent = () => {
        if (isLoadingLocationData) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="font-semibold text-islamic-green-dark mb-4 text-lg">Daily Prayers</h3>
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center text-lg border-b border-stone-200 pb-2">
                                    <SkeletonLoader className="h-6 w-20" />
                                    <SkeletonLoader className="h-6 w-16" />
                                </div>
                            ))}
                        </div>
                    </Card>
                     <Card>
                        <h3 className="font-semibold text-islamic-green-dark mb-4 text-lg text-center">Qibla Direction</h3>
                        <div className="flex justify-center items-center h-48">
                            <SkeletonLoader className="h-32 w-32 rounded-full" />
                        </div>
                    </Card>
                </div>
            );
        }

        if (locationError) {
            return (
                <div className="text-center py-6">
                    <p className="text-lg text-red-600">{locationError}</p>
                    <p className="text-sm text-stone-500 mt-2">Please ensure you have granted location permissions for this site.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-semibold text-islamic-green-dark mb-4 text-lg">Daily Prayers</h3>
                    {prayerTimes ? (
                        <ul className="space-y-3 text-stone-700">
                            {Object.entries(prayerTimes).map(([name, time]) => (
                                <li key={name} className="flex justify-between items-center text-lg border-b border-stone-200 pb-2">
                                    <span className="font-medium">{name}</span>
                                    <span className="font-semibold text-stone-800">{time}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p>No prayer times available.</p>}
                </Card>
                <Card>
                    <h3 className="font-semibold text-islamic-green-dark mb-4 text-lg text-center">Qibla Direction</h3>
                    {qiblaDirection !== null ? (
                        <QiblaCompass qiblaDirection={qiblaDirection} />
                    ) : <p className="text-center">Could not determine Qibla direction.</p>}
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-6 overflow-y-auto p-1 h-full">
            <Card>
                <h2 className="text-xl font-semibold text-islamic-green-dark mb-4">Prayer Times & Qibla</h2>
                <p className="text-stone-600">Accurate prayer times and Qibla direction based on your current location.</p>
            </Card>
            {renderContent()}
        </div>
    );
};

export default PrayerTimesView;
