import { FlatList } from "react-native";
import { DayRow, ScheduleCard, ScheduleContainer } from "./styles";
import moment from "moment";

import { useLanguage, useUtils } from "@components";
import { OText } from "@ui";

export const ScheduleTable = ({ schedule }: any) => {
  const [, t] = useLanguage();
  const [{ timeFormat }] = useUtils()

  const _formatTime = timeFormat

  const formatTime = (timeObj: any) => {
    if (!timeObj || typeof timeObj.hour === 'undefined' || typeof timeObj.minute === 'undefined') {
      return '';
    }
    const date = moment().hour(timeObj.hour).minute(timeObj.minute);
    return date.format(_formatTime ?? 'h:mm a');
  };

  const processedSchedule = [
    { id: 1, day: t('MONDAY', 'Monday') },
    { id: 2, day: t('TUESDAY', 'Tuesday') },
    { id: 3, day: t('WEDNESDAY', 'Wednesday') },
    { id: 4, day: t('THURSDAY', 'Thursday') },
    { id: 5, day: t('FRIDAY', 'Friday') },
    { id: 6, day: t('SATURDAY', 'Saturday') },
    { id: 0, day: t('SUNDAY', 'Sunday') },
  ].map(dayInfo => {
    const dayData = schedule[dayInfo.id];
    let hours = t('CLOSED', 'Closed');
    if (dayData && dayData.enabled && dayData.lapses && dayData.lapses.length > 0) {
      hours = dayData.lapses
        .map((lapse: any) => {
          const openTime = formatTime(lapse.open);
          const closeTime = formatTime(lapse.close);
          return `${openTime} - ${closeTime}`;
        })
        .join('\n');
    }
    return { ...dayInfo, hours };
  });

  const renderItem = ({ item }: any) => {
    const currentDayId = (moment() as any).day();
    const isCurrent = item.id === currentDayId;
    return (
      <DayRow>
        <OText weight={isCurrent ? 700 : 400}>{item.day}</OText>
        <OText weight={isCurrent ? 700 : 400} align='right'>{item.hours}</OText>
      </DayRow>
    );
  };

  return (
    <ScheduleContainer>
      <OText preset='body_lg' weight={700}>{t('SCHEDULE', 'Schedule')}</OText>
      <ScheduleCard>
        <FlatList
          data={processedSchedule}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      </ScheduleCard>
    </ScheduleContainer>
  );
};
