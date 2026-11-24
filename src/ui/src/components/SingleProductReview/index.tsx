import React, { useState, useEffect } from 'react'
import { useTheme } from 'styled-components/native'
import { themeImage } from '@/theme/helpers'

import { SingleProductReviewParams } from '../../types'
import { useReviewCommentList } from '../../utils'

import { ProductContainer } from './styles'
import {
  CommentField,
  QuickComments,
  ReviewBlocks,
  ReviewedNotice,
  ReviewHeader,
  ReviewThumb,
  ThumbsRating
} from '../ReviewOrder/ReviewForm'

import { useLanguage } from '@components'
import { IMAGE_REQUEST, imageUrl } from '@/utils/imageUrl'

export const SingleProductReview = (props: SingleProductReviewParams) => {
  const {
    product,
    formState,
    handleChangeFormState,
    order
  } = props

  const [, t] = useLanguage()
  const theme: any = useTheme()
    const [comments, setComments] = useState<Array<any>>([])
  const [extraComment, setExtraComment] = useState('')
  const [qualification, setQualification] = useState(5)
  const [currentValue, setCurrentValue] = useState(5)

  const commentsList = useReviewCommentList('product')

  const isSelectedComment = (commentKey: number) => {
    const found = comments.find((comment: any) => comment?.key === commentKey)
    return found
  }

  const handleChangeQualification = (index: number) => {
    if (qualification === index) return
    setQualification(index)
    setComments([])
  }

  const handleChangeComment = (commentItem: any) => {
    const found = comments.find((comment: any) => comment?.key === commentItem.key)
    if (found) {
      const _comments = comments.filter((comment: any) => comment?.key !== commentItem.key)
      setComments(_comments)
    } else {
      setComments([...comments, commentItem])
    }
  }

  useEffect(() => {
    const value = qualification ? 5 : 1
    setCurrentValue(value)
    if (value !== currentValue) setComments([])
    if (comments?.length === 0 && !extraComment && formState.changes?.length === 0 && qualification === 5) return
    let _comments = ''
    if (comments.length > 0) {
      comments.map(comment => (_comments += comment.content + '. '))
    }
    const _comment = _comments + extraComment
    let found = false
    const _changes = formState.changes.map((item: any) => {
      if (item?.product_id === product?.product_id) {
        found = true
        return {
          product_id: product?.product_id,
          comment: _comment,
          qualification: qualification
        }
      }
      return item
    })
    if (!found) {
      _changes.push({
        product_id: product?.product_id,
        comment: _comment,
        qualification: qualification
      })
    }
    handleChangeFormState && handleChangeFormState(_changes)
  }, [comments, extraComment, qualification])

  const list = commentsList[qualification === 5 ? 'like' : 'dislike']

  return (
    <ProductContainer>
      <ReviewHeader
        title={t('REVIEW_PRODUCT', 'Review Product')}
        subtitle={`${t('HOW_WAS_YOUR_EXPERIENCE_WITH', 'How was your experience with')} ${product?.name}?`}
      >
        <ReviewThumb
          uri={product?.images ? imageUrl(product?.images, { height: IMAGE_REQUEST.thumbnail }) : null}
          fallback={themeImage(theme, 'placeholder.product')}
        />
      </ReviewHeader>
      {order?.review || (formState?.result?.result && !formState?.result?.error) ? (
        <ReviewedNotice text={t('ORDER_REVIEWED', 'This order has been already reviewed')} />
      ) : (
        <ReviewBlocks
          rating={
            <ThumbsRating
              value={qualification}
              onChange={handleChangeQualification}
              likeLabel={t('LIKE', 'Like')}
              dislikeLabel={t('DISLIKE', 'Dislike')}
            />
          }
          quickComments={
            <QuickComments
              title={list?.title}
              items={list}
              isSelected={(key) => !!isSelectedComment(key)}
              onToggle={handleChangeComment}
            />
          }
          comment={
            <CommentField
              label={t('REVIEW_COMMENT_QUESTION', 'Do you want to add something?')}
              placeholder={t('COMMENTS', 'Comments')}
              onChange={setExtraComment}
            />
          }
        />
      )}
    </ProductContainer>
  )
}
