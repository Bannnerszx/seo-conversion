'use client';

import React from 'react';
import Image from 'next/image';

const TimelineStatus = ({ currentStep }) => {
  const stepValue = currentStep || 1
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 3,
    },
    itemContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: 15,
      height: 15,
    },
    line: {
      height: 3,
      width: 20,
    },
  };

  const statusData = [
    { title: 'Negotiation', value: 1 },
    { title: 'Issued Proforma Invoice', value: 2 },
    { title: 'Order Item', value: 3 },
    { title: 'Payment Confirmed', value: 4 },
    { title: 'Shipping Schedule', value: 5 },
    { title: 'Documents', value: 6 },
    { title: 'Vehicle Received', value: 7 },
  ];

  const getImageSource = (value, isActive) => {
    switch (value) {
      case 1:
        return isActive ? '/chat_step_1_on.webp' : '/chat_step_1_off.webp';
      case 2:
        return isActive ? '/chat_step_2_on.webp' : '/chat_step_2_off.webp';
      case 3:
        return isActive ? '/chat_step_3_on.webp' : '/chat_step_3_off.webp';
      case 4:
        return isActive ? '/chat_step_4_on.webp' : '/chat_step_4_off.webp';
      case 5:
        return isActive ? '/chat_step_5_on.webp' : '/chat_step_5_off.webp';
      case 6:
        return isActive ? '/chat_step_6_on.webp' : '/chat_step_6_off.webp';
      case 7:
        return isActive ? '/chat_step_7_on.webp' : '/chat_step_7_off.webp';
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {statusData.map((item, index) => (
        <div key={index} style={styles.itemContainer}>
          <div
            style={{
              ...styles.dot,
              backgroundColor: stepValue < item.value ? '#C1C1C1' : '#abf7c7',
            }}
          >
            <Image
              src={getImageSource(item.value, stepValue >= item.value)}
              alt={item.title}
              width={15}
              height={15}
              style={styles.image}
            />
          </div>
          {index < statusData.length - 1 && (
            <div
              style={{
                ...styles.line,
                backgroundColor: stepValue < item.value ? '#C1C1C1' : '#abf7c7',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default TimelineStatus;
